import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        try {
            init3DText();
        } catch (error) {
            // Error handling - module will continue without 3D text
        }
    });
} else {
    // DOM already loaded, run immediately
    try {
        init3DText();
    } catch (error) {
        // Error handling - module will continue without 3D text
    }
}

function init3DText() {
    // Get the container element
    const container = document.getElementById('threejs-text-container');
    if (!container) {
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
    
    // Shake animation state
    let isShaking = false;
    let shakeStartTime = 0;
    let originalPosition = { x: 0, y: 0, z: 0 };
    let originalRotation = { x: 0, y: 0, z: 0 };
    let shakeAnimationId = null;
    let shakeMode = 'rotation'; // 'rotation' or 'both'

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

    // Create professional metallic material using MeshStandardMaterial
    const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,  // Bright white/silver for better visibility
        metalness: 0.8,   // High metalness for metallic look
        roughness: 0.15,  // Low roughness = shiny chrome (0 = mirror, 1 = matte)
        envMapIntensity: 1.8,
        emissive: 0x222222, // Subtle emissive for base glow
        emissiveIntensity: 0.25
    });

    // Load environment map texture with equirectangular reflection mapping
    // Uncomment and configure when you have an environment map file
    
    // Option 1: HDR equirectangular image (recommended for realistic reflections)
    // const rgbeLoader = new RGBELoader();
    // rgbeLoader.load(
    //     'path/to/your/environment.hdr', // Replace with your HDR image path
    //     function(texture) {
    //         texture.mapping = THREE.EquirectangularReflectionMapping;
    //         metalMaterial.envMap = texture;
    //         metalMaterial.needsUpdate = true;
    //         
    //         // Generate PMREM for better quality reflections
    //         const pmremGenerator = new THREE.PMREMGenerator(renderer);
    //         pmremGenerator.compileEquirectangularShader();
    //         const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    //         metalMaterial.envMap = envMap;
    //         metalMaterial.needsUpdate = true;
    //         
    //         // Clean up
    //         texture.dispose();
    //         pmremGenerator.dispose();
    //     },
    //     undefined,
    //     function(error) {
    //         console.error('Error loading HDR texture:', error);
    //     }
    // );
    
    // Option 2: EXR equirectangular image (alternative to HDR)
    // const exrLoader = new EXRLoader();
    // exrLoader.load('path/to/your/environment.exr', function(texture) {
    //     texture.mapping = THREE.EquirectangularReflectionMapping;
    //     metalMaterial.envMap = texture;
    //     metalMaterial.needsUpdate = true;
    // });
    
    // Option 3: Regular JPG/PNG equirectangular image
    // const textureLoader = new THREE.TextureLoader();
    // const texture = textureLoader.load('path/to/your/equirectangular-image.jpg');
    // texture.mapping = THREE.EquirectangularReflectionMapping;
    // metalMaterial.envMap = texture;

    // Professional lighting setup inspired by lens flare patterns
    // Ambient light with subtle color temperature
    const ambientLight = new THREE.AmbientLight(0xffffff, Math.PI / 2);
    scene.add(ambientLight);

    // Static product display lighting - spotlight from one angle
    const isMobileLighting = isMobileDevice();
    const isTabletLighting = window.innerWidth > 768 && window.innerWidth <= 1024;
    
    // Adjust spotlight based on device type for better mobile visibility
    let spotLightIntensity = Math.PI * 3;
    let spotLightPosition = { x: 8, y: 12, z: 8 };
    let spotLightAngle = 0.4;
    
    if (isMobileLighting) {
        // Mobile: closer position, higher intensity, wider angle for better coverage
        spotLightIntensity = Math.PI * 4.5; // Increased intensity
        spotLightPosition = { x: 5, y: 8, z: 5 }; // Closer to text
        spotLightAngle = 0.5; // Wider angle for better coverage
    } else if (isTabletLighting) {
        // Tablet: slightly adjusted
        spotLightIntensity = Math.PI * 3.5;
        spotLightPosition = { x: 6, y: 10, z: 6 };
        spotLightAngle = 0.45;
    }
    
    const spotLight = new THREE.SpotLight(0xffffff, spotLightIntensity);
    spotLight.position.set(spotLightPosition.x, spotLightPosition.y, spotLightPosition.z);
    spotLight.angle = spotLightAngle; // Wider angle for product coverage
    spotLight.penumbra = 0.3; // Sharper, more focused edge
    spotLight.decay = 0;
    spotLight.castShadow = false;
    // Target the spotlight at the center of the scene (where text is)
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight);
    scene.add(spotLight.target); // Important: add target to scene

    // Point light for fill lighting (static) - adjust for mobile too
    let pointLightIntensity = Math.PI;
    let pointLightPosition = { x: -10, y: -10, z: -10 };
    
    if (isMobileLighting) {
        // Mobile: closer fill light with higher intensity
        pointLightIntensity = Math.PI * 1.5;
        pointLightPosition = { x: -6, y: -6, z: -6 };
    } else if (isTabletLighting) {
        pointLightIntensity = Math.PI * 1.2;
        pointLightPosition = { x: -8, y: -8, z: -8 };
    }
    
    const pointLight = new THREE.PointLight(0xffffff, pointLightIntensity);
    pointLight.position.set(pointLightPosition.x, pointLightPosition.y, pointLightPosition.z);
    pointLight.decay = 0;
    scene.add(pointLight);

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
        }
    }
    
    // Start a timeout for the font loader itself (in case it hangs)
    const fontLoaderTimeout = setTimeout(() => {
        if (!loadingComplete) {
            if (!textMesh) {
                try {
                    const geometry = new THREE.BoxGeometry(8, 2, 0.5, 64, 64, 16);
                    textMesh = new THREE.Mesh(geometry, metalMaterial);
                    textMesh.position.x = -1.5;
                    scene.add(textMesh);
                } catch (error) {
                    // Error handled silently
                }
            }
            markLoadingComplete();
        }
    }, 2500); // 2.5 second timeout for font loading specifically
    
    loader.load(
        'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
        // onLoad callback
        function(font) {
            clearTimeout(fontLoaderTimeout); // Clear the timeout since we loaded successfully
            try {
                // Responsive text size for mobile and desktop
                const isMobile = isMobileDevice();
                const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // Start with a base size - will be scaled to fit viewport
                let textSize = 1.5; // Use consistent base size, scaling will handle the rest
                const textDepth = isMobile ? 0.375 : (isTablet ? 0.25 : 0.375);
                const bevelThickness = isMobile ? 0.0375 : (isTablet ? 0.025 : 0.0375);
                const bevelSize = isMobile ? 0.0375 : (isTablet ? 0.025 : 0.0375);
                
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
                textMesh = new THREE.Mesh(textGeometry, metalMaterial);
                
                // Camera position is already set before loader, OrbitControls will manage it
                // Calculate and apply scale based on viewport
                const scaleFactor = calculateScaleForViewport(textGeometry, camera, viewportWidth, viewportHeight);
                textMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
                
                
                // Position text - adjust Y position for mobile to appear higher/centered
                textMesh.position.x = 0;  // Centered horizontally
                textMesh.position.y = isMobile ? 0.5 : 0;  // Higher on mobile, centered on desktop
                
                // Store original position and rotation for shake animation
                originalPosition.x = textMesh.position.x;
                originalPosition.y = textMesh.position.y;
                originalPosition.z = textMesh.position.z;
                originalRotation.x = textMesh.rotation.x;
                originalRotation.y = textMesh.rotation.y;
                originalRotation.z = textMesh.rotation.z;
                
                scene.add(textMesh);
                
                // Notify that 3D text is loaded
                markLoadingComplete();
            } catch (error) {
                // Still mark as complete even if there's an error
                markLoadingComplete();
            }
        },
        // onProgress callback (optional)
        undefined,
        // onError callback - critical for handling failures
        function(error) {
            clearTimeout(fontLoaderTimeout); // Clear the timeout since we got an error
            // Create fallback geometry if font fails to load
            if (!textMesh) {
                try {
                    const geometry = new THREE.BoxGeometry(8, 2, 0.5, 64, 64, 16);
                    textMesh = new THREE.Mesh(geometry, metalMaterial);
                    textMesh.position.x = -1.5;
                    scene.add(textMesh);
                } catch (fallbackError) {
                    // Error handled silently
                }
            }
            // Always mark as complete even on error
            markLoadingComplete();
        }
    );

    // Safety timeout to ensure loading always completes (reduced since we have font loader timeout)
    setTimeout(() => {
        if (!loadingComplete) {
            if (!textMesh) {
                try {
                    const geometry = new THREE.BoxGeometry(8, 2, 0.5, 64, 64, 16);
                    textMesh = new THREE.Mesh(geometry, metalMaterial);
                    textMesh.position.x = -1.5;
                    scene.add(textMesh);
                } catch (error) {
                    // Error handled silently
                }
            }
            // Always mark as complete
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
    
    // Rotation limits (in radians) - limit to ±45 degrees
    const MAX_ROTATION_X = Math.PI / 4; // 45 degrees
    const MAX_ROTATION_Y = Math.PI / 4; // 45 degrees
    
    // Elastic spring effect parameters
    const springStiffness = 0.015; // How strong the spring pull is (very gentle)
    const springDamping = 0.92; // Damping factor for smooth return (very smooth)
    
    // Mouse events for desktop (like 3d-material.js)
    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.footer-link') && !e.target.closest('a') && !e.target.closest('button')) {
            isDragging = true;
            // Cancel shake animation when user starts interacting
            if (isShaking && shakeAnimationId) {
                cancelAnimationFrame(shakeAnimationId);
                shakeAnimationId = null;
                isShaking = false;
                // Update original rotation to current rotation so spring return works correctly
                if (textMesh) {
                    originalRotation.x = textMesh.rotation.x;
                    originalRotation.y = textMesh.rotation.y;
                    originalRotation.z = textMesh.rotation.z;
                    targetRotationX = textMesh.rotation.x;
                    targetRotationY = textMesh.rotation.y;
                }
            }
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            // Ensure target rotations are set to current rotations when mouse is released
            // This ensures spring effect starts from the correct position
            if (textMesh) {
                targetRotationX = textMesh.rotation.x;
                targetRotationY = textMesh.rotation.y;
                // Clamp to limits
                targetRotationX = Math.max(-MAX_ROTATION_X, Math.min(MAX_ROTATION_X, targetRotationX));
                targetRotationY = Math.max(-MAX_ROTATION_Y, Math.min(MAX_ROTATION_Y, targetRotationY));
            }
        }
    });
    
    document.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaX = event.clientX - previousMouseX;
            const deltaY = event.clientY - previousMouseY;
            targetRotationY += deltaX * 0.003;
            targetRotationX += deltaY * 0.003;
            
            // Clamp rotation to limits
            targetRotationX = Math.max(-MAX_ROTATION_X, Math.min(MAX_ROTATION_X, targetRotationX));
            targetRotationY = Math.max(-MAX_ROTATION_Y, Math.min(MAX_ROTATION_Y, targetRotationY));
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
            // Cancel shake animation when user starts interacting
            if (isShaking && shakeAnimationId) {
                cancelAnimationFrame(shakeAnimationId);
                shakeAnimationId = null;
                isShaking = false;
                // Update original rotation to current rotation so spring return works correctly
                if (textMesh) {
                    originalRotation.x = textMesh.rotation.x;
                    originalRotation.y = textMesh.rotation.y;
                    originalRotation.z = textMesh.rotation.z;
                    targetRotationX = textMesh.rotation.x;
                    targetRotationY = textMesh.rotation.y;
                }
            }
        }
    }, { passive: true }); // PASSIVE - allows scrolling!
    
    document.addEventListener('touchend', () => {
        if (isTouching) {
            isTouching = false;
            // Ensure target rotations are set to current rotations when touch ends
            // This ensures spring effect starts from the correct position
            if (textMesh) {
                targetRotationX = textMesh.rotation.x;
                targetRotationY = textMesh.rotation.y;
                // Clamp to limits
                targetRotationX = Math.max(-MAX_ROTATION_X, Math.min(MAX_ROTATION_X, targetRotationX));
                targetRotationY = Math.max(-MAX_ROTATION_Y, Math.min(MAX_ROTATION_Y, targetRotationY));
            }
        }
    }, { passive: true }); // PASSIVE - allows scrolling!
    
    document.addEventListener('touchmove', (e) => {
        if (isTouching && !e.target.closest('.footer-link') && !e.target.closest('a') && !e.target.closest('button')) {
            const touch = e.touches[0];
            const deltaX = touch.clientX - previousMouseX;
            const deltaY = touch.clientY - previousMouseY;
            
            // Only rotate if there's significant movement (prevents accidental rotation during scroll)
            if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                // Rotate the mesh (like 3d-material.js)
                targetRotationY += deltaX * 0.003;
                targetRotationX += deltaY * 0.003;
                
                // Clamp rotation to limits
                targetRotationX = Math.max(-MAX_ROTATION_X, Math.min(MAX_ROTATION_X, targetRotationX));
                targetRotationY = Math.max(-MAX_ROTATION_Y, Math.min(MAX_ROTATION_Y, targetRotationY));
                
                previousMouseX = touch.clientX;
                previousMouseY = touch.clientY;
            }
        }
    }, { passive: true }); // PASSIVE - allows scrolling!
    
    
    controls.update();

    // Shake animation function - Damped harmonic oscillator for smooth, natural movement
    function shakeText() {
        if (!textMesh || isShaking) return;
        
        isShaking = true;
        shakeStartTime = performance.now();
        
        // Damped oscillator parameters - Water wave response (slow, smooth, gentle)
        const initialAmplitude = 0.12; // Initial displacement (slightly reduced for gentler motion)
        const initialRotationAmplitude = 0.08; // Initial rotation in radians (reduced for smoother)
        const dampingRatio = 0.45; // Higher damping for smooth water-like motion (less bouncy, more fluid)
        const naturalFrequency = 0.25; // Very slow oscillation frequency (Hz) - like gentle water waves
        const duration = 8000; // Total animation duration in ms (8 seconds - longer for smoother decay)
        
        // Initial velocity (gentle impulse from meteor impact) - much slower, smoother response
        const initialVelocityX = (Math.random() - 0.5) * 0.08; // Reduced for gentler motion
        const initialVelocityY = (Math.random() - 0.5) * 0.08; // Reduced for gentler motion
        const initialVelocityZ = (Math.random() - 0.5) * 0.05; // Reduced for gentler motion
        
        // Initial rotation velocity (angular velocity) - much slower, smoother angular response
        const initialAngularVelocityX = (Math.random() - 0.5) * 0.1; // Pitch - reduced for smoother
        const initialAngularVelocityY = (Math.random() - 0.5) * 0.1; // Yaw - reduced for smoother
        const initialAngularVelocityZ = (Math.random() - 0.5) * 0.08; // Roll - reduced for smoother
        
        // Initial displacement (small random offset)
        const initialDisplacementX = (Math.random() - 0.5) * initialAmplitude;
        const initialDisplacementY = (Math.random() - 0.5) * initialAmplitude;
        const initialDisplacementZ = (Math.random() - 0.5) * initialAmplitude * 0.5;
        
        // Initial rotation (small random offset)
        const initialRotationX = (Math.random() - 0.5) * initialRotationAmplitude;
        const initialRotationY = (Math.random() - 0.5) * initialRotationAmplitude;
        const initialRotationZ = (Math.random() - 0.5) * initialRotationAmplitude * 0.7;
        
        // Track shake animation timing (professional pattern)
        let shakeLastFrameTime = performance.now();
        
        function performShake(currentTime) {
            if (!textMesh) return;
            
            // Cancel shake if user starts interacting
            if (isDragging || isTouching) {
                cancelAnimationFrame(shakeAnimationId);
                shakeAnimationId = null;
                isShaking = false;
                // Update original rotation to current rotation so spring return works correctly
                originalRotation.x = textMesh.rotation.x;
                originalRotation.y = textMesh.rotation.y;
                originalRotation.z = textMesh.rotation.z;
                targetRotationX = textMesh.rotation.x;
                targetRotationY = textMesh.rotation.y;
                return;
            }
            
            // Calculate delta time for frame-rate independent animation
            const deltaTime = Math.min((currentTime - shakeLastFrameTime) / 1000, 0.1);
            shakeLastFrameTime = currentTime;
            
            const elapsed = currentTime - shakeStartTime;
            const t = elapsed * 0.001; // Convert to seconds
            
            if (t < duration * 0.001) {
                // Damped harmonic oscillator equation
                const omega = naturalFrequency * 2 * Math.PI; // Natural frequency in rad/s
                const omegaD = omega * Math.sqrt(1 - dampingRatio * dampingRatio); // Damped frequency
                const decayFactor = Math.exp(-dampingRatio * omega * t); // Exponential decay
                
                const cosTerm = Math.cos(omegaD * t);
                const sinTerm = Math.sin(omegaD * t);
                
                if (shakeMode === 'position' || shakeMode === 'both') {
                    // Position oscillation - water wave pattern with smooth phase offsets
                    const amplitudeX = initialDisplacementX * cosTerm + (initialVelocityX / omegaD) * sinTerm;
                    const shakeX = amplitudeX * decayFactor;
                    
                    // Y-axis phase offset for flowing water motion
                    const phaseOffsetY = Math.PI * 0.4; // Slightly increased for smoother undulation
                    const amplitudeY = initialDisplacementY * Math.cos(omegaD * t + phaseOffsetY) + 
                                       (initialVelocityY / omegaD) * Math.sin(omegaD * t + phaseOffsetY);
                    const shakeY = amplitudeY * decayFactor;
                    
                    // Z-axis phase offset for depth-like motion
                    const phaseOffsetZ = Math.PI * 0.7; // Increased for more pronounced wave-like motion
                    const amplitudeZ = initialDisplacementZ * Math.cos(omegaD * t + phaseOffsetZ) + 
                                       (initialVelocityZ / omegaD) * Math.sin(omegaD * t + phaseOffsetZ);
                    const shakeZ = amplitudeZ * decayFactor;
                    
                    textMesh.position.x = originalPosition.x + shakeX;
                    textMesh.position.y = originalPosition.y + shakeY;
                    textMesh.position.z = originalPosition.z + shakeZ;
                }
                
                if (shakeMode === 'rotation' || shakeMode === 'both') {
                    // Only apply rotation shake if user is NOT interacting
                    if (!isDragging && !isTouching) {
                        // Rotation oscillation (Roll, Pitch, Yaw) - water wave pattern
                        // Pitch (rotation around X-axis) - gentle, smooth
                        const amplitudePitch = initialRotationX * cosTerm + (initialAngularVelocityX / omegaD) * sinTerm;
                        const shakePitch = amplitudePitch * decayFactor;
                        
                        // Yaw (rotation around Y-axis) - smooth phase offset for flowing motion
                        const phaseOffsetYaw = Math.PI * 0.5; // Increased for smoother wave-like motion
                        const amplitudeYaw = initialRotationY * Math.cos(omegaD * t + phaseOffsetYaw) + 
                                            (initialAngularVelocityY / omegaD) * Math.sin(omegaD * t + phaseOffsetYaw);
                        const shakeYaw = amplitudeYaw * decayFactor;
                        
                        // Roll (rotation around Z-axis) - more pronounced phase offset for undulation
                        const phaseOffsetRoll = Math.PI * 0.8; // Increased for more water-like undulation
                        const amplitudeRoll = initialRotationZ * Math.cos(omegaD * t + phaseOffsetRoll) + 
                                             (initialAngularVelocityZ / omegaD) * Math.sin(omegaD * t + phaseOffsetRoll);
                        const shakeRoll = amplitudeRoll * decayFactor;
                        
                        textMesh.rotation.x = originalRotation.x + shakePitch;
                        textMesh.rotation.y = originalRotation.y + shakeYaw;
                        textMesh.rotation.z = originalRotation.z + shakeRoll;
                        
                        // Update target rotation to match shake so spring return works correctly
                        targetRotationX = textMesh.rotation.x;
                        targetRotationY = textMesh.rotation.y;
                    }
                }
                
                // Continue animation with proper timing
                shakeAnimationId = requestAnimationFrame(performShake);
            } else {
                // Smooth transition back to original (water wave easing - slow and gentle)
                // Only return if user is NOT interacting
                if (!isDragging && !isTouching) {
                    const returnSmoothing = 0.08; // Slower, smoother return like water settling
                    textMesh.position.x = damp(textMesh.position.x, originalPosition.x, returnSmoothing * 60, deltaTime);
                    textMesh.position.y = damp(textMesh.position.y, originalPosition.y, returnSmoothing * 60, deltaTime);
                    textMesh.position.z = damp(textMesh.position.z, originalPosition.z, returnSmoothing * 60, deltaTime);
                    textMesh.rotation.x = damp(textMesh.rotation.x, originalRotation.x, returnSmoothing * 60, deltaTime);
                    textMesh.rotation.y = damp(textMesh.rotation.y, originalRotation.y, returnSmoothing * 60, deltaTime);
                    textMesh.rotation.z = damp(textMesh.rotation.z, originalRotation.z, returnSmoothing * 60, deltaTime);
                    
                    // Update target rotation to match so spring return works correctly
                    targetRotationX = textMesh.rotation.x;
                    targetRotationY = textMesh.rotation.y;
                    
                    // Check if close enough to snap to exact values
                    const threshold = 0.001;
                    if (Math.abs(textMesh.position.x - originalPosition.x) < threshold &&
                        Math.abs(textMesh.position.y - originalPosition.y) < threshold &&
                        Math.abs(textMesh.position.z - originalPosition.z) < threshold &&
                        Math.abs(textMesh.rotation.x - originalRotation.x) < threshold &&
                        Math.abs(textMesh.rotation.y - originalRotation.y) < threshold &&
                        Math.abs(textMesh.rotation.z - originalRotation.z) < threshold) {
                        // Snap to exact values
                        textMesh.position.x = originalPosition.x;
                        textMesh.position.y = originalPosition.y;
                        textMesh.position.z = originalPosition.z;
                        textMesh.rotation.x = originalRotation.x;
                        textMesh.rotation.y = originalRotation.y;
                        textMesh.rotation.z = originalRotation.z;
                        targetRotationX = originalRotation.x;
                        targetRotationY = originalRotation.y;
                        isShaking = false;
                        shakeAnimationId = null;
                    } else {
                        // Continue smoothing
                        shakeAnimationId = requestAnimationFrame(performShake);
                    }
                } else {
                    // User is interacting, cancel shake return
                    cancelAnimationFrame(shakeAnimationId);
                    shakeAnimationId = null;
                    isShaking = false;
                    // Update original rotation to current rotation
                    originalRotation.x = textMesh.rotation.x;
                    originalRotation.y = textMesh.rotation.y;
                    originalRotation.z = textMesh.rotation.z;
                    targetRotationX = textMesh.rotation.x;
                    targetRotationY = textMesh.rotation.y;
                }
            }
        }
        
        shakeLastFrameTime = performance.now();
        performShake(shakeLastFrameTime);
    }
    
    // Function to set shake mode (exposed globally for buttons)
    window.setShakeMode = function(mode) {
        shakeMode = mode;
        // Update button styles
        document.querySelectorAll('.shake-mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    };
    
    // Listen for custom event to trigger shake (can be triggered by meters/progress indicators)
    document.addEventListener('meterPassed', shakeText);
    
    // Also listen for scroll progress milestones (25%, 50%, 75%, 100%)
    const scrollMilestones = [0.25, 0.5, 0.75, 1.0];
    let triggeredMilestones = new Set();
    
    function checkScrollProgress() {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
        
        // Check if we've passed any milestone
        scrollMilestones.forEach(milestone => {
            if (progress >= milestone && !triggeredMilestones.has(milestone)) {
                triggeredMilestones.add(milestone);
                shakeText();
            }
        });
        
        // Reset milestones if scrolled back to top
        if (progress < 0.1) {
            triggeredMilestones.clear();
        }
    }
    
    // Throttle scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            cancelAnimationFrame(scrollTimeout);
        }
        scrollTimeout = requestAnimationFrame(checkScrollProgress);
    }, { passive: true });

    // Track time for light animation
    let time = 0;
    
    // FPS counter (only if ?fps=true in URL)
    const urlParams = new URLSearchParams(window.location.search);
    const showFPS = urlParams.get('fps') === 'true';
    const showLights = urlParams.get('lights') === 'true';
    let fps = 0;
    let fpsFrameCount = 0;
    let fpsLastTime = performance.now();
    
    // Show FPS meter if parameter is present
    if (showFPS) {
        const fpsMeter = document.getElementById('fps-meter');
        if (fpsMeter) {
            fpsMeter.style.display = 'block';
        }
    }
    
    // Light helpers disabled - no lights in scene
    let lightHelpers = [];
    
    // Professional easing function for smooth interpolation (inspired by lens flare patterns)
    function damp(current, target, smoothing, deltaTime) {
        return current + (target - current) * (1 - Math.exp(-smoothing * deltaTime * 60));
    }
    
    // Track delta time for frame-rate independent animations
    let lastFrameTime = performance.now();
    
    function animate(currentTime) {
        // Calculate delta time for frame-rate independent animations (professional pattern)
        const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.1); // Cap at 100ms
        lastFrameTime = currentTime;
        
        // Calculate FPS (only if enabled)
        if (showFPS) {
            fpsFrameCount++;
            if (currentTime >= fpsLastTime + 1000) {
                fps = fpsFrameCount;
                fpsFrameCount = 0;
                fpsLastTime = currentTime;
                
                // Update FPS display
                const fpsElement = document.getElementById('fps-value');
                if (fpsElement) {
                    fpsElement.textContent = fps;
                    fpsElement.style.color = fps >= 55 ? '#0f0' : (fps >= 30 ? '#ff0' : '#f00');
                }
            }
        }
        
        // Update time with delta (frame-rate independent)
        time += deltaTime;
        
        
        // Update controls for mouse (desktop)
        if (controls) {
            controls.update();
        }
        
        // Apply rotation to mesh with smooth easing (professional pattern from lens flare)
        if (textMesh) {
            if (isDragging || isTouching) {
                // User is actively rotating - smooth interpolation with easing
                const smoothing = 10.0; // Higher = faster response
                
                // Ensure target rotations are clamped before interpolation
                targetRotationX = Math.max(-MAX_ROTATION_X, Math.min(MAX_ROTATION_X, targetRotationX));
                targetRotationY = Math.max(-MAX_ROTATION_Y, Math.min(MAX_ROTATION_Y, targetRotationY));
                
                textMesh.rotation.x = damp(textMesh.rotation.x, targetRotationX, smoothing, deltaTime);
                textMesh.rotation.y = damp(textMesh.rotation.y, targetRotationY, smoothing, deltaTime);
                
                // Clamp rotation to limits (safety check)
                textMesh.rotation.x = Math.max(-MAX_ROTATION_X, Math.min(MAX_ROTATION_X, textMesh.rotation.x));
                textMesh.rotation.y = Math.max(-MAX_ROTATION_Y, Math.min(MAX_ROTATION_Y, textMesh.rotation.y));
            } else {
                // Elastic spring effect with smooth easing (like lens flare opacity transitions)
                // Ensure target rotations are initialized if they're NaN or undefined
                if (isNaN(targetRotationX) || targetRotationX === undefined) targetRotationX = textMesh.rotation.x;
                if (isNaN(targetRotationY) || targetRotationY === undefined) targetRotationY = textMesh.rotation.y;
                
                // Spring force pulls toward zero (center position)
                const springForceX = -textMesh.rotation.x * springStiffness;
                const springForceY = -textMesh.rotation.y * springStiffness;
                
                // Apply spring force with damping (scale by delta for consistency)
                targetRotationX += springForceX * deltaTime * 60;
                targetRotationY += springForceY * deltaTime * 60;
                
                // Apply damping (exponential decay scaled by delta)
                targetRotationX *= Math.pow(springDamping, deltaTime * 60);
                targetRotationY *= Math.pow(springDamping, deltaTime * 60);
                
                // Clamp target rotation to limits (important for spring return)
                targetRotationX = Math.max(-MAX_ROTATION_X, Math.min(MAX_ROTATION_X, targetRotationX));
                targetRotationY = Math.max(-MAX_ROTATION_Y, Math.min(MAX_ROTATION_Y, targetRotationY));
                
                // Smooth interpolation with easing (professional pattern)
                const returnSmoothing = 0.08 * 60; // Convert to per-second rate
                textMesh.rotation.x = damp(textMesh.rotation.x, targetRotationX, returnSmoothing, deltaTime);
                textMesh.rotation.y = damp(textMesh.rotation.y, targetRotationY, returnSmoothing, deltaTime);
                
                // Clamp actual rotation to limits (safety check)
                textMesh.rotation.x = Math.max(-MAX_ROTATION_X, Math.min(MAX_ROTATION_X, textMesh.rotation.x));
                textMesh.rotation.y = Math.max(-MAX_ROTATION_Y, Math.min(MAX_ROTATION_Y, textMesh.rotation.y));
                
                // Snap to zero if very close (prevent infinite tiny oscillations)
                const threshold = 0.001;
                if (Math.abs(textMesh.rotation.x) < threshold && Math.abs(targetRotationX) < threshold) {
                    textMesh.rotation.x = 0;
                    targetRotationX = 0;
                }
                if (Math.abs(textMesh.rotation.y) < threshold && Math.abs(targetRotationY) < threshold) {
                    textMesh.rotation.y = 0;
                    targetRotationY = 0;
                }
            }
            
            // Update original position and rotation if text changes (e.g., on resize)
            if (!isShaking) {
                originalPosition.x = textMesh.position.x;
                originalPosition.y = textMesh.position.y;
                originalPosition.z = textMesh.position.z;
                originalRotation.x = textMesh.rotation.x;
                originalRotation.y = textMesh.rotation.y;
                originalRotation.z = textMesh.rotation.z;
            }
        }
        
        // Render scene
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }
    
    
    // Use setAnimationLoop with proper timing (professional pattern)
    lastFrameTime = performance.now();
    
    // Ensure animation loop starts - defensive check for production
    if (renderer && typeof renderer.setAnimationLoop === 'function') {
        renderer.setAnimationLoop(animate);
    } else {
        // Fallback to requestAnimationFrame if setAnimationLoop is not available
        function fallbackAnimate() {
            animate(performance.now());
            requestAnimationFrame(fallbackAnimate);
        }
        requestAnimationFrame(fallbackAnimate);
    }
    
    // Initial render to ensure scene is visible immediately
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }

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
        
        // Update lighting based on device type
        if (isMobile) {
            // Mobile: closer position, higher intensity, wider angle
            spotLight.intensity = Math.PI * 4.5;
            spotLight.position.set(5, 8, 5);
            spotLight.angle = 0.5;
            pointLight.intensity = Math.PI * 1.5;
            pointLight.position.set(-6, -6, -6);
        } else if (isTablet) {
            // Tablet: slightly adjusted
            spotLight.intensity = Math.PI * 3.5;
            spotLight.position.set(6, 10, 6);
            spotLight.angle = 0.45;
            pointLight.intensity = Math.PI * 1.2;
            pointLight.position.set(-8, -8, -8);
        } else {
            // Desktop: original settings
            spotLight.intensity = Math.PI * 3;
            spotLight.position.set(8, 12, 8);
            spotLight.angle = 0.4;
            pointLight.intensity = Math.PI;
            pointLight.position.set(-10, -10, -10);
        }
        
        // Recalculate text scale based on new viewport
        if (textMesh) {
            const scaleFactor = calculateScaleForViewport(textMesh.geometry, camera, viewportWidth, viewportHeight);
            textMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
            
            // Update text Y position for mobile
            textMesh.position.y = textCenterY;
            
            // Update original position and rotation
            originalPosition.x = textMesh.position.x;
            originalPosition.y = textMesh.position.y;
            originalPosition.z = textMesh.position.z;
            originalRotation.x = textMesh.rotation.x;
            originalRotation.y = textMesh.rotation.y;
            originalRotation.z = textMesh.rotation.z;
        }
        
        // Update renderer size
        renderer.setSize(viewportWidth, viewportHeight);
    });
}
