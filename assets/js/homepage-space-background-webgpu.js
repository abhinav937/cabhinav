// WebGPU Space Background - High Performance Starfield
(function() {
  const canvas = document.getElementById('space-canvas');
  if (!canvas) return;

  // Check WebGPU support
  async function initWebGPU() {
    if (!navigator.gpu) {
      console.log('WebGPU not available, falling back to Canvas 2D');
      return null;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.log('WebGPU adapter not available, falling back to Canvas 2D');
        return null;
      }

      const device = await adapter.requestDevice();
      const context = canvas.getContext('webgpu');
      
      if (!context) {
        console.log('WebGPU context not available, falling back to Canvas 2D');
        return null;
      }

      const format = navigator.gpu.getPreferredCanvasFormat();
      context.configure({
        device,
        format,
        alphaMode: 'premultiplied'
      });

      return { device, context, format };
    } catch (error) {
      console.log('WebGPU initialization failed:', error, '- falling back to Canvas 2D');
      return null;
    }
  }

  // Set canvas size
  function setCanvasSize() {
    const width = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  setCanvasSize();

  // Function to get star configuration based on current viewport/perf profile
  function getStarLayers() {
    const isMobile = window.innerWidth <= 768;
    const densityScale = window.devicePixelRatio > 1.3 ? 0.65 : 0.85;
    return [
      { count: Math.round((isMobile ? 280 : 620) * densityScale), speed: 0.03, size: [0.18, 0.45], color: [1.0, 1.0, 1.0, 1.0] },
      { count: Math.round((isMobile ? 140 : 300) * densityScale), speed: 0.01, size: [0.45, 0.8], color: [180/255, 200/255, 255/255, 0.7] },
      { count: Math.round((isMobile ? 45 : 90) * densityScale), speed: 0.005, size: [0.8, 1.2], color: [255/255, 220/255, 200/255, 0.6] }
    ];
  }

  // WebGPU implementation
  async function initWebGPUBackground() {
    const gpu = await initWebGPU();
    if (!gpu) return false;

    const { device, context, format } = gpu;

    // Helper function to create star data
    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function createStarData(starLayers) {
      const totalStars = starLayers.reduce((sum, layer) => sum + layer.count, 0);
      const starData = new Float32Array(totalStars * 9);
      let starIndex = 0;
      
      starLayers.forEach((layer, layerIndex) => {
        for (let i = 0; i < layer.count; i++) {
          const angle = rand(0, Math.PI * 2);
          const radius = rand(0, Math.max(canvas.width, canvas.height) * 1.5);
          const baseSize = rand(layer.size[0], layer.size[1]);
          const twinkleSpeed = rand(0.001, 0.003); // EXACT match to Canvas 2D
          const twinklePhase = rand(0, Math.PI * 2);
          
          const offset = starIndex * 9;
          starData[offset] = 0; // x (will be calculated in shader)
          starData[offset + 1] = 0; // y (will be calculated in shader)
          starData[offset + 2] = angle;
          starData[offset + 3] = radius;
          starData[offset + 4] = baseSize;
          starData[offset + 5] = twinkleSpeed;
          starData[offset + 6] = twinklePhase;
          starData[offset + 7] = layerIndex;
          starData[offset + 8] = 0; // padding
          
          starIndex++;
        }
      });
      
      return { starData, totalStars };
    }

    // Initialize stars - will be updated on resize
    let currentStarLayers = getStarLayers();
    let { starData, totalStars } = createStarData(currentStarLayers);
    let TOTAL_STARS = totalStars; // Mutable variable for resize updates
    
    // Create star data buffer
    const starDataSize = 9 * 4; // 9 floats per star
    let starBuffer = device.createBuffer({
      size: TOTAL_STARS * starDataSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    device.queue.writeBuffer(starBuffer, 0, starData);

    // Uniform buffer for time and canvas size
    // Using milliseconds to match Canvas 2D Date.now() exactly
    const uniformBuffer = device.createBuffer({
      size: 4 * 4, // timeMs (f32), canvasWidth (f32), canvasHeight (f32), globalAngle (f32)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // Compute shader for star physics
    const computeShaderCode = `
      struct Star {
        x: f32,
        y: f32,
        angle: f32,
        radius: f32,
        baseSize: f32,
        twinkleSpeed: f32,
        twinklePhase: f32,
        layer: f32,
        padding: f32,
      }

      struct Uniforms {
        timeMs: f32, // Milliseconds to match Canvas 2D Date.now()
        canvasWidth: f32,
        canvasHeight: f32,
        globalAngle: f32,
      }

      @group(0) @binding(0) var<storage, read_write> stars: array<Star>;
      @group(0) @binding(1) var<uniform> uniforms: Uniforms;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let index = id.x;
        if (index >= arrayLength(&stars)) { return; }

        var star = stars[index];
        
        // Calculate position based on rotation
        let angle = star.angle + uniforms.globalAngle;
        let cx = uniforms.canvasWidth * 1.5;
        let cy = uniforms.canvasHeight * 1.5;
        
        star.x = cx + cos(angle) * star.radius;
        star.y = cy + sin(angle) * star.radius;
        
        stars[index] = star;
      }
    `;

    const computeShader = device.createShaderModule({
      code: computeShaderCode
    });

    // Render shader for drawing stars (point sprites)
    const renderShaderCode = `
      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) starPos: vec2<f32>,
        @location(1) starSize: f32,
        @location(2) starColor: vec4<f32>,
        @location(3) twinkle: f32,
        @location(4) baseSize: f32,
        @location(5) localPos: vec2<f32>, // pixel-space offset from center
      }

      struct Star {
        x: f32,
        y: f32,
        angle: f32,
        radius: f32,
        baseSize: f32,
        twinkleSpeed: f32,
        twinklePhase: f32,
        layer: f32,
        padding: f32,
      }

      struct Uniforms {
        timeMs: f32, // Milliseconds to match Canvas 2D Date.now()
        canvasWidth: f32,
        canvasHeight: f32,
        globalAngle: f32,
      }

      @group(0) @binding(0) var<storage, read> stars: array<Star>;
      @group(0) @binding(1) var<uniform> uniforms: Uniforms;

      // Layer colors - EXACT match to Canvas 2D
      const LAYER_COLORS: array<vec4<f32>, 3> = array<vec4<f32>, 3>(
        vec4<f32>(1.0, 1.0, 1.0, 1.0), // white
        vec4<f32>(0.706, 0.784, 1.0, 0.7), // rgba(180,200,255,0.7)
        vec4<f32>(1.0, 0.863, 0.784, 0.6) // rgba(255,220,200,0.6)
      );

      @vertex
      fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
        let starIndex = vertexIndex / 6u;
        let quadVertex = vertexIndex % 6u;
        
        let star = stars[starIndex];
        
        // Calculate twinkle - EXACT match to Canvas 2D: 0.7 + 0.3 * sin(now * star.twinkleSpeed + star.twinklePhase)
        // Using timeMs (milliseconds) to match Canvas 2D Date.now() exactly
        let twinkle = 0.7 + 0.3 * sin(uniforms.timeMs * star.twinkleSpeed + star.twinklePhase);
        let size = star.baseSize * twinkle;
        
        // Get color based on layer
        let layerIndex = i32(star.layer);
        let color = LAYER_COLORS[layerIndex];
        
        // Quad vertices in normalized device coordinates
        let quadPositions = array<vec2<f32>, 6>(
          vec2<f32>(-1.0, -1.0),
          vec2<f32>(1.0, -1.0),
          vec2<f32>(-1.0, 1.0),
          vec2<f32>(-1.0, 1.0),
          vec2<f32>(1.0, -1.0),
          vec2<f32>(1.0, 1.0)
        );
        
        let quadPos = quadPositions[quadVertex];
        
        // Convert star position to NDC
        let ndcX = (star.x / uniforms.canvasWidth) * 2.0 - 1.0;
        let ndcY = 1.0 - (star.y / uniforms.canvasHeight) * 2.0;
        
        // Scale quad by star size - include shadowBlur for proper rendering
        // Canvas 2D shadowBlur extends beyond the circle, so we need larger quads
        var quadSize = size;
        var shadowBlurSize = 2.0;
        if (star.baseSize > 2.0) {
          shadowBlurSize = 8.0;
        }
        if (star.baseSize > 1.5) {
          quadSize = size * 1.7 + 6.0; // Smaller glow padding
        } else {
          quadSize = size + shadowBlurSize; // Star size + shadowBlur
        }
        
        // Offset in pixel space for this vertex (-quadSize .. quadSize)
        let offsetX = quadPos.x * quadSize;
        let offsetY = quadPos.y * quadSize;
        
        // Convert offsets to NDC (accounting for canvas dimensions)
        let ndcOffsetX = (offsetX * 2.0) / uniforms.canvasWidth;
        let ndcOffsetY = (-offsetY * 2.0) / uniforms.canvasHeight; // screen Y is inverted
        
        var output: VertexOutput;
        output.position = vec4<f32>(ndcX + ndcOffsetX, ndcY + ndcOffsetY, 0.0, 1.0);
        output.starPos = vec2<f32>(star.x, star.y);
        output.starSize = size;
        output.starColor = color;
        output.twinkle = twinkle;
        output.baseSize = star.baseSize; // Pass baseSize for glow check
        output.localPos = vec2<f32>(offsetX, offsetY);
        return output;
      }

      @fragment
      fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
        // Distance from center in pixel space (provided by vertex shader)
        let pixelDist = length(input.localPos);
        
        // Glow effect (matches Canvas 2D shadow blur 16)
        var glowAlpha = 0.0;
        if (input.baseSize > 1.3) {
          let glowSize = input.starSize * 1.7;
          // Smooth falloff: 1 near center, 0 at glowSize+6
          let glowFalloff = 1.0 - smoothstep(glowSize, glowSize + 6.0, pixelDist);
          glowAlpha = 0.06 * input.twinkle * glowFalloff;
        }
        
        // Main star with soft edge (shadowBlur 2 or 8)
        var shadowBlurSize = 2.0;
        if (input.baseSize > 2.0) {
          shadowBlurSize = 8.0;
        }
        let starFalloff = 1.0 - smoothstep(input.starSize, input.starSize + shadowBlurSize, pixelDist);
        let mainAlpha = 0.225 * input.twinkle * starFalloff;
        
        let finalAlpha = input.starColor.a * (glowAlpha + mainAlpha);
        if (finalAlpha <= 0.0001) {
          discard;
        }
        return vec4<f32>(input.starColor.rgb, finalAlpha);
      }
    `;

    const renderShader = device.createShaderModule({
      code: renderShaderCode
    });

    // Create bind groups
    const computeBindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }
      ]
    });

    const renderBindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }
      ]
    });

    const computePipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [computeBindGroupLayout]
      }),
      compute: {
        module: computeShader,
        entryPoint: 'main'
      }
    });

    const renderPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [renderBindGroupLayout]
      }),
      vertex: {
        module: renderShader,
        entryPoint: 'vs_main'
      },
      fragment: {
        module: renderShader,
        entryPoint: 'fs_main',
        targets: [{ format }]
      },
      primitive: {
        topology: 'triangle-list'
      }
    });

    let computeBindGroup = device.createBindGroup({
      layout: computeBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: starBuffer } },
        { binding: 1, resource: { buffer: uniformBuffer } }
      ]
    });

    let renderBindGroup = device.createBindGroup({
      layout: renderBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: starBuffer } },
        { binding: 1, resource: { buffer: uniformBuffer } }
      ]
    });

    // Function to recreate stars when mobile/desktop changes
    function recreateStarsIfNeeded() {
      const newStarLayers = getStarLayers();
      const newTotalStars = newStarLayers.reduce((sum, layer) => sum + layer.count, 0);
      
      // Check if star count changed (mobile/desktop switch)
      if (newTotalStars !== TOTAL_STARS) {
        const { starData: newStarData, totalStars } = createStarData(newStarLayers);
        TOTAL_STARS = totalStars;
        currentStarLayers = newStarLayers;
        
        // Destroy old buffer
        starBuffer.destroy();
        
        // Create new buffer
        starBuffer = device.createBuffer({
          size: TOTAL_STARS * starDataSize,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        
        device.queue.writeBuffer(starBuffer, 0, newStarData);
        
        // Recreate bind groups with new buffer
        computeBindGroup = device.createBindGroup({
          layout: computeBindGroupLayout,
          entries: [
            { binding: 0, resource: { buffer: starBuffer } },
            { binding: 1, resource: { buffer: uniformBuffer } }
          ]
        });
        
        renderBindGroup = device.createBindGroup({
          layout: renderBindGroupLayout,
          entries: [
            { binding: 0, resource: { buffer: starBuffer } },
            { binding: 1, resource: { buffer: uniformBuffer } }
          ]
        });
      }
    }

    // Shooting stars overlay (Canvas 2D for gradients)
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.id = 'space-canvas-overlay';
    overlayCanvas.style.position = 'fixed';
    overlayCanvas.style.top = '0';
    overlayCanvas.style.left = '0';
    overlayCanvas.style.width = '100%';
    overlayCanvas.style.height = '100%';
    overlayCanvas.style.pointerEvents = 'none';
    overlayCanvas.style.zIndex = '1';
    canvas.parentNode.insertBefore(overlayCanvas, canvas.nextSibling);
    
    const overlayCtx = overlayCanvas.getContext('2d');
    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;

    const SHOOTING_STAR_LIFETIME = 1200;
    const SHOOTING_STAR_INTERVAL_MIN = 2200;
    const SHOOTING_STAR_INTERVAL_MAX = 4600;
    let shootingStars = [];
    let lastShootingStarUpdate = Date.now();
    let lastShootingStarSpawn = Date.now();
    let nextShootingStarDelay = rand(SHOOTING_STAR_INTERVAL_MIN, SHOOTING_STAR_INTERVAL_MAX);

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function spawnShootingStar() {
      const startX = rand(-canvas.width * 0.1, canvas.width * 0.3);
      const startY = rand(-canvas.height * 0.05, canvas.height * 0.2);
      const angle = rand(Math.PI / 10, Math.PI / 6); // 18° - 30° downward-right
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const len = rand(240, 360);
      const speed = len / SHOOTING_STAR_LIFETIME;

      shootingStars.push({
        x: startX,
        y: startY,
        dx,
        dy,
        speed,
        start: Date.now(),
        len,
        size: rand(1.1, 1.7),
        color: 'rgba(255,255,255,0.98)'
      });

      lastShootingStarSpawn = Date.now();
      nextShootingStarDelay = rand(SHOOTING_STAR_INTERVAL_MIN, SHOOTING_STAR_INTERVAL_MAX);
    }

    function drawShootingStars(now) {
      shootingStars = shootingStars.filter(star => now - star.start < SHOOTING_STAR_LIFETIME);
      const dt = now - lastShootingStarUpdate;
      lastShootingStarUpdate = now;
      
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      
      shootingStars.forEach(star => {
        const age = now - star.start;
        const fade = 1 - age / SHOOTING_STAR_LIFETIME;
        star.x += star.dx * star.speed * dt;
        star.y += star.dy * star.speed * dt;
        let tailLen = star.len * fade;
        const tailX = star.x - star.dx * tailLen;
        const tailY = star.y - star.dy * tailLen;
        const grad = overlayCtx.createLinearGradient(star.x, star.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255,255,255,${0.8 * fade})`);
        grad.addColorStop(0.2, `rgba(255,255,255,${0.25 * fade})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        overlayCtx.save();
        overlayCtx.globalAlpha = 1;
        overlayCtx.strokeStyle = grad;
        overlayCtx.beginPath();
        overlayCtx.moveTo(star.x, star.y);
        overlayCtx.lineTo(tailX, tailY);
        overlayCtx.lineWidth = star.size * (0.8 + 0.7 * fade);
        overlayCtx.shadowBlur = 12;
        overlayCtx.shadowColor = 'white';
        overlayCtx.stroke();
        overlayCtx.restore();
        overlayCtx.save();
        overlayCtx.globalAlpha = 0.85 * fade;
        overlayCtx.shadowBlur = 18;
        overlayCtx.shadowColor = 'white';
        overlayCtx.beginPath();
        overlayCtx.arc(star.x, star.y, star.size * 1.3, 0, Math.PI * 2);
        overlayCtx.fillStyle = 'white';
        overlayCtx.fill();
        overlayCtx.restore();
      });
    }

    // Animation loop
    let globalAngle = 0;

    function animate() {
      const now = Date.now(); // Milliseconds - EXACT match to Canvas 2D
      globalAngle += 0.00024;

      // Update uniforms - using milliseconds to match Canvas 2D Date.now()
      const uniformData = new Float32Array([
        now, // timeMs - milliseconds
        canvas.width,
        canvas.height,
        globalAngle
      ]);
      device.queue.writeBuffer(uniformBuffer, 0, uniformData);

      // Compute pass
      const computeEncoder = device.createCommandEncoder();
      const computePass = computeEncoder.beginComputePass();
      computePass.setPipeline(computePipeline);
      computePass.setBindGroup(0, computeBindGroup);
      computePass.dispatchWorkgroups(Math.ceil(TOTAL_STARS / 64));
      computePass.end();

      // Render pass
      const renderEncoder = device.createCommandEncoder();
      const renderPass = renderEncoder.beginRenderPass({
        colorAttachments: [{
          view: context.getCurrentTexture().createView(),
          loadOp: 'clear',
          clearValue: { r: 0.086, g: 0.086, b: 0.094, a: 1.0 }, // #161618
          storeOp: 'store'
        }]
      });

      renderPass.setPipeline(renderPipeline);
      renderPass.setBindGroup(0, renderBindGroup);
      renderPass.draw(TOTAL_STARS * 6); // 6 vertices per star
      renderPass.end();

      device.queue.submit([computeEncoder.finish(), renderEncoder.finish()]);

      // Draw shooting stars overlay
      drawShootingStars(now);
      if (now - lastShootingStarSpawn >= nextShootingStarDelay) {
        spawnShootingStar();
      }

      requestAnimationFrame(animate);
    }

    animate();

    // Handle resize - check if mobile/desktop changed and recreate stars
    function handleResize() {
      setCanvasSize();
      overlayCanvas.width = canvas.width;
      overlayCanvas.height = canvas.height;
      
      // Recreate stars if mobile/desktop status changed
      recreateStarsIfNeeded();
    }

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return true;
  }

  // Try WebGPU, fallback to Canvas 2D
  initWebGPUBackground().then(success => {
    if (!success) {
      // Fallback to Canvas 2D implementation
      console.log('Loading Canvas 2D fallback...');
      const script = document.createElement('script');
      script.src = './assets/js/homepage-space-background.js';
      document.head.appendChild(script);
    } else {
      console.log('✅ WebGPU space background initialized successfully!');
    }
  });
})();

