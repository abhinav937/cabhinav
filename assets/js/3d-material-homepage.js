import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

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
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
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

                // One rotating light orbiting around the equator (horizontal plane)
                float orbitRadius = 70.0;  // Closer radius for more intensity
                float orbitSpeed = 1.0;     // Faster rotation
                float orbitHeight = 0.0;    // Keep at equator (Y = 0)
                
                // Light 1: Rotating around equator
                vec3 rotatingLight = vec3(
                    cos(time * orbitSpeed) * orbitRadius,
                    orbitHeight,
                    sin(time * orbitSpeed) * orbitRadius
                );
                
                // Four fixed corner lights - dimmer to emphasize rotating light
                float cornerDistance = 120.0;  // Further distance to reduce intensity
                float cornerHeight = 60.0;     // Height offset for corners
                
                // Top-left corner
                vec3 cornerTopLeft = vec3(-cornerDistance, cornerHeight, -cornerDistance);
                // Top-right corner
                vec3 cornerTopRight = vec3(cornerDistance, cornerHeight, -cornerDistance);
                // Bottom-left corner
                vec3 cornerBottomLeft = vec3(-cornerDistance, -cornerHeight, cornerDistance);
                // Bottom-right corner
                vec3 cornerBottomRight = vec3(cornerDistance, -cornerHeight, cornerDistance);

                vec3 color = vec3(0.0);

                vec3 lights[5];
                lights[0] = rotatingLight;
                lights[1] = cornerTopLeft;
                lights[2] = cornerTopRight;
                lights[3] = cornerBottomLeft;
                lights[4] = cornerBottomRight;

                // Light intensities - rotating light is much more powerful
                float rotatingLightIntensity = 3.5;  // Much brighter rotating light
                float cornerLightIntensity = 0.4;    // Dimmer corner lights for contrast
                
                vec3 lightColors[5];
                lightColors[0] = lightTemperature * rotatingLightIntensity;  // Rotating light - much brighter
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
                    // Extra boost for rotating light (index 0)
                    float lightMultiplier = (i == 0) ? 1.5 : 1.0;  // Additional multiplier for rotating light
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
                color += metalColor * 0.03 * lightTemperature;
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

    loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
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
        
        // Ensure camera position is updated before calculating scale
        updateCameraPosition();
        
        // Calculate and apply scale based on viewport
        const scaleFactor = calculateScaleForViewport(textGeometry, camera, viewportWidth, viewportHeight);
        textMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Debug logging (can be removed in production)
        if (window.innerWidth <= 768) {
            console.log('Mobile - Scale:', scaleFactor.toFixed(2), 'Viewport:', viewportWidth, 'x', viewportHeight);
        }
        
        // Position text - adjust Y position for mobile to appear higher/centered
        textMesh.position.x = 0;  // Centered horizontally
        textMesh.position.y = isMobile ? 0.5 : 0;  // Higher on mobile, centered on desktop
        scene.add(textMesh);
    });

    setTimeout(() => {
        if (!textMesh) {
            const geometry = new THREE.BoxGeometry(8, 2, 0.5, 64, 64, 16);
            textMesh = new THREE.Mesh(geometry, customMaterial);
            textMesh.position.x = -1.5;
            scene.add(textMesh);
        }
    }, 1000);

    // Responsive camera position
    function updateCameraPosition() {
        const isMobile = isMobileDevice();
        const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
        
        if (isMobile) {
            camera.position.z = 3.5;  // Closer on mobile for better fit
            camera.position.y = -0.2;  // Lower camera to look up at text (makes text appear higher)
        } else if (isTablet) {
            camera.position.z = 7;
            camera.position.y = 0.1;
        } else {
            camera.position.z = 10;
            camera.position.y = 0;
        }
        
        // Make camera look at the text center
        camera.lookAt(0, isMobile ? 0.5 : 0, 0);
    }
    
    updateCameraPosition();

    let targetRotationX = 0;
    let targetRotationY = 0;
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;

    // Mouse events for rotation only
    document.addEventListener('mousedown', (e) => {
        isDragging = true;
    });

    document.addEventListener('mouseup', () => isDragging = false);

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

    // Touch events for mobile - improved responsiveness
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouching = false;
    let touchScale = isMobileDevice() ? 0.015 : 0.01; // More sensitive on mobile

    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('#threejs-text-container')) {
            e.preventDefault(); // Prevent default touch behavior
            isTouching = true;
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            previousMouseX = touch.clientX;
            previousMouseY = touch.clientY;
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        isTouching = false;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (isTouching && e.target.closest('#threejs-text-container')) {
            e.preventDefault(); // Prevent scrolling while rotating
            const touch = e.touches[0];
            const deltaX = touch.clientX - previousMouseX;
            const deltaY = touch.clientY - previousMouseY;
            
            // Use touch scale for smoother rotation on mobile
            targetRotationY += deltaX * touchScale;
            targetRotationX += deltaY * touchScale;
            
            previousMouseX = touch.clientX;
            previousMouseY = touch.clientY;
        }
    }, { passive: false });

    function animate() {
        requestAnimationFrame(animate);
        materialUniforms.time.value += 0.01;
        if (textMesh) {
            textMesh.rotation.x += (targetRotationX - textMesh.rotation.x) * 0.1;
            textMesh.rotation.y += (targetRotationY - textMesh.rotation.y) * 0.1;
        }
        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = isMobileDevice();
        
        // Update camera aspect ratio
        camera.aspect = viewportWidth / viewportHeight;
        camera.updateProjectionMatrix();
        
        // Update camera position
        updateCameraPosition();
        
        // Recalculate text scale based on new viewport
        if (textMesh) {
            const scaleFactor = calculateScaleForViewport(textMesh.geometry, camera, viewportWidth, viewportHeight);
            textMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
            
            // Update text Y position for mobile
            textMesh.position.y = isMobile ? 0.5 : 0;
        }
        
        // Update renderer size
        renderer.setSize(viewportWidth, viewportHeight);
    });

    animate();
}
