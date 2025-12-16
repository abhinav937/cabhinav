/**
 * FloatingText3D - Professional 3D Text Animation System
 * Creates floating 3D text with bounds checking and responsive design
 */
class FloatingText3D {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.textMeshes = [];
    this.textLineMeshes = [];
    this.textInitialPositions = [];
    this.clock = null;
    this.animationId = null;
    this.isDisposed = false;
    
    // Mouse tracking for camera movement
    this.mouseX = 0;
    this.mouseY = 0;
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    
    // Configuration
    this.config = {
      camera: {
        fov: 45,
        near: 1,
        far: 10000,
        position: { x: 0, y: -300, z: 600 } // Adjusted Y to show text better
      },
      text: {
        fontUrl: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        color: 0xffffff,
        title: {
          desktop: { size: 100, y: 150 },
          mobile: { size: 50, y: 100 }
        },
        subtitle: {
          desktop: { size: 40, y: -150 },
          mobile: { size: 20, y: -100 }
        }
      },
      animation: {
        floatSpeed: 0.8,
        rotationSpeed: 0.5,
        orbitSpeed: 0.3,
        scaleSpeed: 1.5,
        floatAmount: { desktop: 0.3, mobile: 0.25 },
        orbitAmount: { desktop: 0.25, mobile: 0.2 }
      },
      bounds: {
        margin: { desktop: 0.35, mobile: 0.3 }
      }
    };
  }

  /**
   * Initialize the 3D text system
   */
  async init() {
    if (this.isDisposed) {
      console.warn('FloatingText3D: Cannot initialize disposed instance');
      return;
    }

    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`FloatingText3D: Container #${this.containerId} not found`);
      return;
    }

    try {
      await this.setupScene();
      await this.loadFonts();
      this.setupResizeHandler();
      this.startAnimation();
    } catch (error) {
      console.error('FloatingText3D: Initialization failed', error);
    }
  }

  /**
   * Setup Three.js scene, camera, and renderer
   */
  async setupScene() {
    await this.loadThreeJS();
    const THREE = this.THREE;
    const OrbitControls = this.OrbitControls;
    
    const width = window.innerWidth;
    const height = window.innerHeight - 120;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // Camera
    const cfg = this.config.camera;
    this.camera = new THREE.PerspectiveCamera(cfg.fov, width / height, cfg.near, cfg.far);
    this.camera.position.set(cfg.position.x, cfg.position.y, cfg.position.z);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Controls - limited rotation, no zoom, quick response
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05; // Quick, responsive damping
    
    // Disable zoom completely - all methods
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    
    // Lock distance to prevent any zoom
    const initialDistance = Math.sqrt(
      Math.pow(this.camera.position.x, 2) + 
      Math.pow(this.camera.position.y, 2) + 
      Math.pow(this.camera.position.z, 2)
    );
    this.controls.minDistance = initialDistance;
    this.controls.maxDistance = initialDistance;
    
    // Limit rotation angles (in radians)
    this.controls.minAzimuthAngle = -Math.PI / 3; // Limit horizontal rotation to ±60 degrees
    this.controls.maxAzimuthAngle = Math.PI / 3;
    this.controls.minPolarAngle = Math.PI / 3; // Limit vertical rotation (45 to 135 degrees)
    this.controls.maxPolarAngle = (2 * Math.PI) / 3;
    
    // Quick rotation speed/sensitivity
    this.controls.rotateSpeed = 1.0; // Normal/fast rotation speed
    this.controls.autoRotate = false;

      // Enhanced lighting for better material rendering
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      this.scene.add(ambientLight);

      // Main directional light
      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight1.position.set(5, 5, 5);
      this.scene.add(directionalLight1);

      // Secondary light for depth
      const directionalLight2 = new THREE.DirectionalLight(0x4488ff, 0.5);
      directionalLight2.position.set(-5, -5, -5);
      this.scene.add(directionalLight2);

      // Point light for glow effect - white to match text
      this.pointLight = new THREE.PointLight(0xffffff, 1.5, 2000);
      this.pointLight.position.set(0, 0, -150); // Closer to text (text is at z=-150)
      this.scene.add(this.pointLight);

      this.clock = new THREE.Clock();
  }

  /**
   * Load Three.js modules
   */
  async loadThreeJS() {
    // Use import map aliases if available, otherwise fallback to full URLs
    const THREE = await import('three');
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
    const { FontLoader } = await import('three/addons/loaders/FontLoader.js');
    
    // Store THREE globally for use in other methods
    this.THREE = THREE;
    this.OrbitControls = OrbitControls;
    this.FontLoader = FontLoader;
    
    return { THREE, OrbitControls, FontLoader };
  }

  /**
   * Load fonts and create text meshes
   */
  async loadFonts() {
    const THREE = this.THREE;
    const FontLoader = this.FontLoader;
    const fontLoader = new FontLoader();
    
    return new Promise((resolve, reject) => {
      fontLoader.load(
        this.config.text.fontUrl,
        (font) => {
          this.createTextMeshes(THREE, font);
          resolve();
        },
        undefined,
        (error) => {
          console.error('FloatingText3D: Font loading failed', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Create text meshes from font with white color (grok style)
   */
  createTextMeshes(THREE, font) {
    const isMobile = window.innerWidth <= 768;
    const titleSize = isMobile ? 50 : 150; // Much bigger on desktop
    const subtitleSize = isMobile ? 20 : 40; // Smaller subtitle

      // Center texts vertically - more spacing between title and subtitle
      const titleY = isMobile ? 100 : 100; // Title position (lowered)
      const subtitleY = isMobile ? -80 : -180; // Subtitle much lower for clear separation

    // Create title with white color (grok style)
    this.createTextMesh(THREE, font, 'Abhinav\nChinnusamy', titleSize, titleY, 0xffffff);
    
    // Create subtitle with white color (grok style)
    this.createTextMesh(THREE, font, 'Power Electronics\nEngineer & Researcher', subtitleSize, subtitleY, 0xffffff);
  }

  /**
   * Create a single text mesh with outline (white grok style)
   */
  createTextMesh(THREE, font, message, size, yOffset, color) {
    // White outline material
    const matDark = new THREE.LineBasicMaterial({
      color: 0xffffff, // White outline
      side: THREE.DoubleSide,
      linewidth: 2
    });

    // White filled material with metallic properties and subtle glow
    const matLite = new THREE.MeshStandardMaterial({
      color: 0xffffff, // White base
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xffffff, // White glow
      emissiveIntensity: 0.3, // Subtle glow
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    const shapes = font.generateShapes(message, size);
    const geometry = new THREE.ShapeGeometry(shapes);
    geometry.computeBoundingBox();

    const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    geometry.translate(xMid, 0, 0);

    // Filled text (centered horizontally, positioned vertically)
    const text = new THREE.Mesh(geometry, matLite);
    text.position.z = -150;
    text.position.y = yOffset;
    text.position.x = 0; // Centered
    this.scene.add(text);
    this.textMeshes.push(text);
    this.textInitialPositions.push({ x: 0, y: yOffset, z: -150 });

    // Outline text (following reference pattern exactly)
    const holeShapes = [];
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      if (shape.holes && shape.holes.length > 0) {
        for (let j = 0; j < shape.holes.length; j++) {
          const hole = shape.holes[j];
          holeShapes.push(hole);
        }
      }
    }
    shapes.push(...holeShapes);

    const lineText = new THREE.Object3D();
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      const points = shape.getPoints();
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      lineGeometry.translate(xMid, 0, 0);
      const lineMesh = new THREE.Line(lineGeometry, matDark);
      lineText.add(lineMesh);
    }
    lineText.position.z = -150;
    lineText.position.y = yOffset;
    lineText.position.x = 0; // Centered
    this.scene.add(lineText);
    this.textLineMeshes.push(lineText);
  }

  /**
   * Calculate viewport bounds
   */
  getViewportBounds() {
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = Math.abs(this.camera.position.z);
    const vFov = 2 * Math.tan(fov / 2) * distance;
    const hFov = vFov * this.camera.aspect;
    
    const isMobile = window.innerWidth <= 768;
    const margin = isMobile ? this.config.bounds.margin.mobile : this.config.bounds.margin.desktop;
    
    const halfWidth = (hFov * margin) / 2;
    const halfHeight = (vFov * margin) / 2;
    
    return {
      minX: this.camera.position.x - halfWidth,
      maxX: this.camera.position.x + halfWidth,
      minY: this.camera.position.y - halfHeight,
      maxY: this.camera.position.y + halfHeight,
      centerX: this.camera.position.x,
      centerY: this.camera.position.y,
      width: hFov * margin,
      height: vFov * margin,
      isMobile: isMobile
    };
  }

  /**
   * Setup window resize handler and mouse tracking
   */
  setupResizeHandler() {
    this.handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight - 120;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      
      // Update window half values
      this.windowHalfX = window.innerWidth / 2;
      this.windowHalfY = window.innerHeight / 2;
    };
    window.addEventListener('resize', this.handleResize);
    
    // Mouse/pointer tracking for camera movement
    this.handlePointerMove = (event) => {
      // Track mouse position relative to window center
      this.mouseX = event.clientX - this.windowHalfX;
      this.mouseY = event.clientY - this.windowHalfY;
    };
    
    // Add event listener to container and also document for better coverage
    this.container.style.touchAction = 'none';
    this.container.addEventListener('pointermove', this.handlePointerMove);
    this.container.addEventListener('mousemove', this.handlePointerMove);
    
    // Also listen on document for when mouse leaves container
    document.addEventListener('pointermove', this.handlePointerMove);
    document.addEventListener('mousemove', this.handlePointerMove);
  }

  /**
   * Animation loop - Dangling/swaying movement in space
   */
  animate() {
    if (this.isDisposed) return;

    this.animationId = requestAnimationFrame(() => this.animate());

    const elapsedTime = this.clock.getElapsedTime();

    // Mouse-based camera movement (limited range but quick response)
    // Limit mouse influence to prevent excessive movement
    const maxMouseInfluence = 50; // Maximum camera offset from center
    const mouseScale = 0.5; // Original sensitivity
    
    const targetX = Math.max(-maxMouseInfluence, Math.min(maxMouseInfluence, this.mouseX * mouseScale));
    const targetY = Math.max(-maxMouseInfluence, Math.min(maxMouseInfluence, -this.mouseY * mouseScale));
    
    // Quick, responsive interpolation
    this.camera.position.x += (targetX - this.camera.position.x) * 0.05; // Quick response
    this.camera.position.y += (targetY - this.camera.position.y) * 0.05;
    this.camera.lookAt(this.scene.position);

    // Animate point light for dynamic glow - keep it near the text
    if (this.pointLight) {
      this.pointLight.position.x = Math.sin(elapsedTime * 0.5) * 80;
      this.pointLight.position.y = Math.cos(elapsedTime * 0.6) * 80;
      this.pointLight.position.z = -150 + Math.sin(elapsedTime * 0.4) * 30; // Stay near text
      // Pulse the intensity for dynamic effect
      this.pointLight.intensity = 1.2 + Math.sin(elapsedTime * 1.5) * 0.5;
    }

    // Dangling/swaying movement - like floating in space
    this.textMeshes.forEach((textMesh, i) => {
      const initialPos = this.textInitialPositions[i];
      const phase = i * Math.PI * 0.5;
      
      // Gentle dangling/swaying motion
      const swayX = Math.sin(elapsedTime * 0.6 + phase) * 20; // Side to side sway
      const swayY = Math.sin(elapsedTime * 0.8 + phase * 1.2) * 15; // Up and down float
      const swayZ = Math.cos(elapsedTime * 0.5 + phase) * 10; // Forward/back float
      
      // Gentle rotation like it's dangling
      textMesh.rotation.y = Math.sin(elapsedTime * 0.4 + phase) * 0.15;
      textMesh.rotation.x = Math.cos(elapsedTime * 0.3 + phase) * 0.1;
      textMesh.rotation.z = Math.sin(elapsedTime * 0.35 + phase) * 0.05;
      
      // Apply dangling movement
      textMesh.position.x = initialPos.x + swayX;
      textMesh.position.y = initialPos.y + swayY;
      textMesh.position.z = initialPos.z + swayZ;
    });

    // Animate line meshes with same dangling movement
    this.textLineMeshes.forEach((lineText, i) => {
      if (this.textInitialPositions[i]) {
        const initialPos = this.textInitialPositions[i];
        const phase = i * Math.PI * 0.5;
        
        const swayX = Math.sin(elapsedTime * 0.6 + phase) * 20;
        const swayY = Math.sin(elapsedTime * 0.8 + phase * 1.2) * 15;
        const swayZ = Math.cos(elapsedTime * 0.5 + phase) * 10;
        
        lineText.rotation.y = Math.sin(elapsedTime * 0.4 + phase) * 0.15;
        lineText.rotation.x = Math.cos(elapsedTime * 0.3 + phase) * 0.1;
        lineText.rotation.z = Math.sin(elapsedTime * 0.35 + phase) * 0.05;
        
        lineText.position.x = initialPos.x + swayX;
        lineText.position.y = initialPos.y + swayY;
        lineText.position.z = initialPos.z + swayZ;
      }
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Start animation loop
   */
  startAnimation() {
    this.animate();
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.isDisposed) return;

    this.isDisposed = true;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }

    if (this.handlePointerMove) {
      if (this.container) {
        this.container.removeEventListener('pointermove', this.handlePointerMove);
        this.container.removeEventListener('mousemove', this.handlePointerMove);
      }
      document.removeEventListener('pointermove', this.handlePointerMove);
      document.removeEventListener('mousemove', this.handlePointerMove);
    }

    // Dispose Three.js resources
    if (this.textMeshes) {
      this.textMeshes.forEach(mesh => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
    }

    if (this.textLineMeshes) {
      this.textLineMeshes.forEach(lineText => {
        lineText.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }
    }

    this.textMeshes = [];
    this.textLineMeshes = [];
    this.textInitialPositions = [];
  }
}

// Export for ES6 modules
export default FloatingText3D;
