import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    init3DText();
});

function init3DText() {
    // Get the container element
    const container = document.getElementById('threejs-text-container');
    if (!container) {
        console.error('Container #threejs-text-container not found');
        return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    container.appendChild(renderer.domElement);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputEncoding = THREE.sRGBEncoding;
    

    const loader = new FontLoader();
    let textMesh;

    // Helper function to detect mobile devices
    function isMobileDevice() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Helper function to calculate responsive text size
    function calculateTextSize() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = isMobileDevice();
        const isTablet = viewportWidth > 768 && viewportWidth <= 1024;
        
        if (isMobile) {
            // Mobile: scale based on viewport width, ensure it fits
            const baseSize = Math.min(viewportWidth * 0.0012, 0.5);
            return Math.max(baseSize, 0.3); // Minimum size for readability
        } else if (isTablet) {
            // Tablet: medium size
            return 1.0;
        } else {
            // Desktop: full size
            return 1.5;
        }
    }

    // Chrome preset (default)
    const chromePreset = {
        roughness: 0.05,
        anisotropy: 0,
        ior: 2.95,
        clearcoat: 0,
        dispersion: 0,
        metalColor: [0.95, 0.95, 0.98]
    };

    const materialUniforms = {
        time: { value: 0 },
        roughness: { value: chromePreset.roughness },
        anisotropy: { value: chromePreset.anisotropy },
        ior: { value: chromePreset.ior },
        clearcoat: { value: chromePreset.clearcoat },
        dispersion: { value: chromePreset.dispersion },
        metalColor: { value: new THREE.Vector3(...chromePreset.metalColor) },
        lightTemperature: { value: new THREE.Vector3(1, 1, 1) }
    };

    const customMaterial = new THREE.ShaderMaterial({
        uniforms: materialUniforms,
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec3 vWorldPosition;
            varying vec2 vUv;
            varying vec3 vTangent;
            varying vec3 vBitangent;

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vec3 objectTangent = vec3(1.0, 0.0, 0.0);
                vTangent = normalize(normalMatrix * objectTangent);
                vBitangent = cross(vNormal, vTangent);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform float roughness;
            uniform float anisotropy;
            uniform float ior;
            uniform float clearcoat;
            uniform float dispersion;
            uniform vec3 metalColor;
            uniform vec3 lightTemperature;

            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec3 vWorldPosition;
            varying vec2 vUv;
            varying vec3 vTangent;
            varying vec3 vBitangent;

            vec3 fresnelSchlick(float cosTheta, vec3 F0) {
                return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
            }

            float distributionGGX(vec3 N, vec3 H, float roughness) {
                float a = roughness * roughness;
                float a2 = a * a;
                float NdotH = max(dot(N, H), 0.0);
                float NdotH2 = NdotH * NdotH;
                float num = a2;
                float denom = (NdotH2 * (a2 - 1.0) + 1.0);
                denom = 3.14159265359 * denom * denom;
                return num / denom;
            }

            float distributionAnisotropicGGX(vec3 N, vec3 H, vec3 T, vec3 B, float roughness, float anisotropy) {
                float roughnessT = roughness * (1.0 + anisotropy);
                float roughnessB = roughness * (1.0 - anisotropy);
                float dotTH = dot(T, H);
                float dotBH = dot(B, H);
                float dotNH = dot(N, H);
                float a2 = roughnessT * roughnessB;
                float d = dotTH * dotTH / (roughnessT * roughnessT) + 
                         dotBH * dotBH / (roughnessB * roughnessB) + 
                         dotNH * dotNH;
                return 1.0 / (3.14159265359 * roughnessT * roughnessB * d * d);
            }

            float geometrySchlickGGX(float NdotV, float roughness) {
                float r = (roughness + 1.0);
                float k = (r * r) / 8.0;
                float num = NdotV;
                float denom = NdotV * (1.0 - k) + k;
                return num / denom;
            }

            float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
                float NdotV = max(dot(N, V), 0.0);
                float NdotL = max(dot(N, L), 0.0);
                float ggx2 = geometrySchlickGGX(NdotV, roughness);
                float ggx1 = geometrySchlickGGX(NdotL, roughness);
                return ggx1 * ggx2;
            }

            void main() {
                vec3 normal = normalize(vNormal);
                vec3 tangent = normalize(vTangent);
                vec3 bitangent = normalize(vBitangent);
                vec3 viewDir = normalize(vViewPosition);

                // Cinematic rotating light with dramatic 3D elliptical orbit and dynamic movement
                float orbitSpeed = 0.25;   // Rotation speed
                
                // Create a cinematic angle with smooth acceleration/deceleration
                float cinematicAngle = time * orbitSpeed;
                
                // Elliptical orbit - wider horizontally, creates more dynamic movement
                float horizontalRadius = 85.0;  // Wider horizontal axis
                float depthRadius = 60.0;       // Narrower depth axis for elliptical shape
                
                // Dramatic vertical movement - follows a figure-8 pattern for cinematic effect
                // Creates sweeping high and low positions
                float verticalAmplitude = 55.0;  // Large vertical range
                float verticalPhase = sin(cinematicAngle) * verticalAmplitude;
                
                // Dynamic radius variation - light gets closer and farther for dramatic intensity changes
                float radiusVariation = 15.0;  // How much the radius varies
                float dynamicRadius = horizontalRadius + cos(cinematicAngle * 1.5) * radiusVariation;
                
                // Tilt the orbit plane slightly for more interesting angles (not perfectly horizontal)
                float orbitTilt = 0.3;  // Tilt angle in radians
                
                // Calculate base position in elliptical orbit
                float baseX = cos(cinematicAngle) * dynamicRadius;
                float baseZ = sin(cinematicAngle) * depthRadius;
                
                // Apply orbit tilt for more dramatic 3D movement
                float tiltedX = baseX * cos(orbitTilt) - verticalPhase * sin(orbitTilt);
                float tiltedY = baseX * sin(orbitTilt) + verticalPhase * cos(orbitTilt);
                float tiltedZ = baseZ;
                
                // Light 1: Cinematic 3D elliptical orbit with dramatic vertical and radius variation
                vec3 rotatingLight = vec3(
                    tiltedX,
                    tiltedY,
                    tiltedZ
                );
                
                // Four fixed corner lights - positioned closer with bigger radius, tilted in front of text
                float cornerDistance = 50.0;   // Closer distance (bigger radius) for more intensity
                float cornerHeight = 40.0;      // Height offset for corners
                float frontOffset =100.0;      // Negative Z to position lights in front of text (towards camera)
                
                // Top-left corner - tilted in front
                vec3 cornerTopLeft = vec3(-cornerDistance, cornerHeight, frontOffset);
                // Top-right corner - tilted in front
                vec3 cornerTopRight = vec3(cornerDistance, cornerHeight, frontOffset);
                // Bottom-left corner - tilted in front
                vec3 cornerBottomLeft = vec3(-cornerDistance, -cornerHeight, frontOffset);
                // Bottom-right corner - tilted in front
                vec3 cornerBottomRight = vec3(cornerDistance, -cornerHeight, frontOffset);

                vec3 color = vec3(0.0);

                vec3 lights[5];
                lights[0] = rotatingLight;
                lights[1] = cornerTopLeft;
                lights[2] = cornerTopRight;
                lights[3] = cornerBottomLeft;
                lights[4] = cornerBottomRight;

                // Light intensities - corner lights are now brighter since they're closer and in front
                float rotatingLightIntensity = 3.5;  // Rotating light
                float cornerLightIntensity = 2.5;    // Brighter corner lights since they're closer and in front
                
                vec3 lightColors[5];
                lightColors[0] = lightTemperature * rotatingLightIntensity;  // Rotating light
                lightColors[1] = vec3(0.5, 0.5, 0.7) * lightTemperature * cornerLightIntensity;  // Top-left: blue tint
                lightColors[2] = vec3(0.7, 0.5, 0.5) * lightTemperature * cornerLightIntensity;  // Top-right: red tint
                lightColors[3] = vec3(0.5, 0.7, 0.5) * lightTemperature * cornerLightIntensity;  // Bottom-left: green tint
                lightColors[4] = vec3(0.7, 0.7, 0.5) * lightTemperature * cornerLightIntensity;  // Bottom-right: yellow tint

                for(int i = 0; i < 5; i++) {
                    vec3 lightDir = normalize(lights[i] - vWorldPosition);
                    vec3 halfwayDir = normalize(lightDir + viewDir);

                    float n1 = 1.0;
                    float n2 = ior;
                    float F0_scalar = pow((n1 - n2) / (n1 + n2), 2.0);
                    vec3 F0 = mix(vec3(F0_scalar), metalColor, 0.95);

                    float D = distributionAnisotropicGGX(normal, halfwayDir, tangent, bitangent, roughness, anisotropy);
                    float G = geometrySmith(normal, viewDir, lightDir, roughness);
                    vec3 F = fresnelSchlick(max(dot(halfwayDir, viewDir), 0.0), F0);

                    vec3 kS = F;
                    vec3 kD = vec3(1.0) - kS;
                    kD *= 0.0;

                    vec3 numerator = D * G * F;
                    float denominator = 4.0 * max(dot(normal, viewDir), 0.0) * max(dot(normal, lightDir), 0.0) + 0.0001;
                    vec3 specular = numerator / denominator;

                    float NdotL = max(dot(normal, lightDir), 0.0);
                    // Extra boost for rotating light (index 0) and corner lights (indices 1-4) since they're in front
                    float lightMultiplier = (i == 0) ? 1.5 : 1.3;  // Additional multiplier for all lights
                    color += (kD * metalColor / 3.14159265359 + specular) * lightColors[i] * NdotL * lightMultiplier;
                }

                if(clearcoat > 0.0) {
                    vec3 clearcoatNormal = normal;
                    float clearcoatRoughness = 0.04;

                    // Use rotating light for clearcoat with higher intensity
                    vec3 lightDir = normalize(lights[0] - vWorldPosition);
                    vec3 halfwayDir = normalize(lightDir + viewDir);

                    float D = distributionGGX(clearcoatNormal, halfwayDir, clearcoatRoughness);
                    float G = geometrySmith(clearcoatNormal, viewDir, lightDir, clearcoatRoughness);
                    vec3 F = fresnelSchlick(max(dot(halfwayDir, viewDir), 0.0), vec3(0.04));

                    vec3 clearcoatSpecular = D * G * F / (4.0 * max(dot(clearcoatNormal, viewDir), 0.0) * max(dot(clearcoatNormal, lightDir), 0.0) + 0.0001);
                    float NdotL = max(dot(clearcoatNormal, lightDir), 0.0);

                    color += clearcoatSpecular * clearcoat * NdotL * lightTemperature * 3.5;
                }

                float edgeFactor = pow(1.0 - abs(dot(normal, viewDir)), 2.0);
                vec3 dispersionColor = vec3(
                    sin(edgeFactor * 3.14159 * 2.0),
                    sin(edgeFactor * 3.14159 * 2.0 + 2.094),
                    sin(edgeFactor * 3.14159 * 2.0 + 4.189)
                ) * dispersion;

                color += dispersionColor * edgeFactor;
                // Increased base brightness so text doesn't look so dark
                color += metalColor * 0.18 * lightTemperature;
                color = color / (color + vec3(1.0));
                color = pow(color, vec3(1.0/2.2));

                gl_FragColor = vec4(color, 1.0);
            }
        `
    });

    // Helper function to calculate scale based on camera frustum
    function calculateScaleForViewport(geometry, camera, viewportWidth, viewportHeight) {
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        const textWidth = boundingBox.max.x - boundingBox.min.x;
        const textHeight = boundingBox.max.y - boundingBox.min.y;
        
        // Calculate visible width/height in world units at camera distance
        const distance = Math.abs(camera.position.z);
        const vFOV = camera.fov * Math.PI / 180; // Convert to radians
        const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
        const visibleWidth = visibleHeight * (viewportWidth / viewportHeight);
        
        // Use 75% of visible area for text (leaving margins) - more aggressive scaling
        const maxWidth = visibleWidth * 0.75;
        const maxHeight = visibleHeight * 0.65;
        
        // Calculate scale factors
        const scaleX = maxWidth / textWidth;
        const scaleY = maxHeight / textHeight;
        const scaleFactor = Math.min(scaleX, scaleY);
        
        // Always scale to fit, but don't scale up beyond 1.0
        return Math.min(Math.max(scaleFactor, 0.1), 1.0); // Clamp between 0.1 and 1.0
    }

    // Track if loading has completed to prevent duplicate calls
    let loadingComplete = false;
    
    function markLoadingComplete() {
        if (!loadingComplete) {
            loadingComplete = true;
            if (window.markThreeJsTextLoaded) {
                window.markThreeJsTextLoaded();
            }
        }
    }
    
    loader.load(
        'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
        // onLoad callback
        function(font) {
            try {
                // Responsive text size for mobile and desktop
                const isMobile = isMobileDevice();
                const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // Start with a base size - will be scaled to fit viewport
                let textSize = 1.5; // Use consistent base size, scaling will handle the rest
                const textDepth = isMobile ? 0.1 : (isTablet ? 0.25 : 0.375);
                const bevelThickness = isMobile ? 0.01 : (isTablet ? 0.025 : 0.0375);
                const bevelSize = isMobile ? 0.01 : (isTablet ? 0.025 : 0.0375);
                
                const textGeometry = new TextGeometry('Abhinav\nChinnusamy', {
                    font: font,
                    size: textSize,
                    depth: textDepth,
                    curveSegments: isMobile ? 6 : (isTablet ? 16 : 32),
                    bevelEnabled: true,
                    bevelThickness: bevelThickness,
                    bevelSize: bevelSize,
                    bevelSegments: isMobile ? 3 : (isTablet ? 8 : 16)
                });
                textGeometry.center();
                textGeometry.computeVertexNormals();
                
                // Create mesh first
                textMesh = new THREE.Mesh(textGeometry, customMaterial);
                
                // Camera position is already set before loader, OrbitControls will manage it
                // Calculate and apply scale based on viewport
                const scaleFactor = calculateScaleForViewport(textGeometry, camera, viewportWidth, viewportHeight);
                textMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
                
                
                // Position text - adjust Y position for mobile to appear higher/centered
                textMesh.position.x = 0;  // Centered horizontally
                textMesh.position.y = isMobile ? 0.5 : 0;  // Higher on mobile, centered on desktop
                scene.add(textMesh);
                
                // Notify that 3D text is loaded
                markLoadingComplete();
            } catch (error) {
                console.error('Error creating 3D text:', error);
                // Still mark as complete even if there's an error
                markLoadingComplete();
            }
        },
        // onProgress callback (optional)
        undefined,
        // onError callback - critical for handling failures
        function(error) {
            console.error('Error loading font:', error);
            // Create fallback geometry if font fails to load
            if (!textMesh) {
                try {
                    const geometry = new THREE.BoxGeometry(8, 2, 0.5, 64, 64, 16);
                    textMesh = new THREE.Mesh(geometry, customMaterial);
                    textMesh.position.x = -1.5;
                    scene.add(textMesh);
                } catch (fallbackError) {
                    console.error('Error creating fallback geometry:', fallbackError);
                }
            }
            // Always mark as complete even on error
            markLoadingComplete();
        }
    );

    // Safety timeout to ensure loading always completes (increased from 1s to 3s)
    setTimeout(() => {
        if (!textMesh && !loadingComplete) {
            try {
                const geometry = new THREE.BoxGeometry(8, 2, 0.5, 64, 64, 16);
                textMesh = new THREE.Mesh(geometry, customMaterial);
                textMesh.position.x = -1.5;
                scene.add(textMesh);
            } catch (error) {
                console.error('Error creating timeout fallback geometry:', error);
            }
            // Always mark as complete
            markLoadingComplete();
        } else if (!loadingComplete) {
            // If textMesh exists but loading wasn't marked complete, mark it now
            markLoadingComplete();
        }
    }, 3000);

    // Set initial camera position based on device type
    // OrbitControls will manage the camera from here
    const isMobile = isMobileDevice();
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    
    let initialCameraDistance;
    let textCenterY;
    
    if (isMobile) {
        initialCameraDistance = 3.5;
        textCenterY = 0.5;
        camera.position.set(0, -0.2, initialCameraDistance);
    } else if (isTablet) {
        initialCameraDistance = 7;
        textCenterY = 0;
        camera.position.set(0, 0.1, initialCameraDistance);
    } else {
        initialCameraDistance = 10;
        textCenterY = 0;
        camera.position.set(0, 0, initialCameraDistance);
    }
    
    // Set up OrbitControls for MOUSE ONLY (desktop)
    // Touch will be handled manually like 3d-material.js
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, textCenterY, 0);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // DISABLE OrbitControls touch handling - we'll handle it manually
    controls.touches = {
        ONE: THREE.TOUCH.NONE,
        TWO: THREE.TOUCH.NONE
    };
    
    // Manual rotation state (like 3d-material.js)
    let targetRotationX = 0;
    let targetRotationY = 0;
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    
    // Mouse events for desktop (like 3d-material.js)
    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.footer-link') && !e.target.closest('a') && !e.target.closest('button')) {
            isDragging = true;
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    document.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaX = event.clientX - previousMouseX;
            const deltaY = event.clientY - previousMouseY;
            targetRotationY += deltaX * 0.01;
            targetRotationX += deltaY * 0.01;
        }
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    });
    
    // Touch events for mobile (EXACTLY like 3d-material.js - document level, passive)
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouching = false;
    
    document.addEventListener('touchstart', (e) => {
        // Don't interfere with footer links or buttons
        if (!e.target.closest('.footer-link') && !e.target.closest('a') && !e.target.closest('button')) {
            isTouching = true;
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            previousMouseX = touch.clientX;
            previousMouseY = touch.clientY;
        }
    }, { passive: true }); // PASSIVE - allows scrolling!
    
    document.addEventListener('touchend', () => {
        isTouching = false;
    }, { passive: true }); // PASSIVE - allows scrolling!
    
    document.addEventListener('touchmove', (e) => {
        if (isTouching && !e.target.closest('.footer-link') && !e.target.closest('a') && !e.target.closest('button')) {
            const touch = e.touches[0];
            const deltaX = touch.clientX - previousMouseX;
            const deltaY = touch.clientY - previousMouseY;
            
            // Rotate the mesh (like 3d-material.js)
            targetRotationY += deltaX * 0.01;
            targetRotationX += deltaY * 0.01;
            
            previousMouseX = touch.clientX;
            previousMouseY = touch.clientY;
        }
    }, { passive: true }); // PASSIVE - allows scrolling!
    
    
    controls.update();

    function animate() {
        materialUniforms.time.value += 0.01;
        
        // Update controls for mouse (desktop)
        controls.update();
        
        // Apply rotation to mesh (like 3d-material.js)
        if (textMesh) {
            textMesh.rotation.x += (targetRotationX - textMesh.rotation.x) * 0.1;
            textMesh.rotation.y += (targetRotationY - textMesh.rotation.y) * 0.1;
        }
        
        renderer.render(scene, camera);
    }
    
    
    // Use setAnimationLoop like the Three.js example for better performance
    renderer.setAnimationLoop(animate);

    window.addEventListener('resize', () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = isMobileDevice();
        const isTablet = viewportWidth > 768 && viewportWidth <= 1024;
        
        // Update camera aspect ratio
        camera.aspect = viewportWidth / viewportHeight;
        camera.updateProjectionMatrix();
        
        // Update controls target based on device type
        const textCenterY = isMobile ? 0.5 : 0;
        controls.target.set(0, textCenterY, 0);
        
        // Recalculate text scale based on new viewport
        if (textMesh) {
            const scaleFactor = calculateScaleForViewport(textMesh.geometry, camera, viewportWidth, viewportHeight);
            textMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
            
            // Update text Y position for mobile
            textMesh.position.y = textCenterY;
        }
        
        // Update renderer size
        renderer.setSize(viewportWidth, viewportHeight);
    });
}
