import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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

    // Professional dynamic lighting setup - Slightly brighter
    // Hemisphere Light - provides natural sky/ground lighting for better depth
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x777777, 1.0);
    scene.add(hemisphereLight);

    // Balanced ambient for good base visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    // Key Light - Main warm directional light (rotating for subtle animation)
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.0); // Bright white
    keyLight.position.set(60, 50, 40);
    keyLight.castShadow = false;
    scene.add(keyLight);

    // Fill Light - Cooler fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.8); // Bright white
    fillLight.position.set(-60, 30, 30);
    scene.add(fillLight);

    // Rim Light - Strong point light behind for dramatic edge highlights
    const rimLight = new THREE.PointLight(0xffffff, 2.8, 250);
    rimLight.position.set(0, 0, -100);
    scene.add(rimLight);

    // Top accent light - Warm spotlight from above
    const topLight = new THREE.PointLight(0xffffff, 2.5, 180);
    topLight.position.set(0, 80, 0);
    scene.add(topLight);

    // Side accent lights
    const accentLight1 = new THREE.PointLight(0xffffff, 1.8, 130);
    accentLight1.position.set(50, 20, 50);
    scene.add(accentLight1);

    const accentLight2 = new THREE.PointLight(0xffffff, 1.8, 130);
    accentLight2.position.set(-50, -10, 50);
    scene.add(accentLight2);

    // Additional side lights for more depth
    const sideLight1 = new THREE.PointLight(0xffffff, 1.5, 110);
    sideLight1.position.set(70, 0, 20);
    scene.add(sideLight1);

    const sideLight2 = new THREE.PointLight(0xffffff, 1.5, 110);
    sideLight2.position.set(-70, 10, 20);
    scene.add(sideLight2);

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

    // Track time for light animation
    let time = 0;
    
    function animate() {
        time += 0.01;
        
        // Animate key light rotation for subtle movement
        const keyAngle = time * 0.15;
        keyLight.position.set(
            Math.cos(keyAngle) * 60,
            50 + Math.sin(time * 0.1) * 10, // Subtle vertical movement
            Math.sin(keyAngle) * 60 + 40
        );
        
        // Animate accent lights for dynamic effect
        const accent1Angle = time * 0.12;
        accentLight1.position.set(
            Math.cos(accent1Angle) * 50,
            20 + Math.cos(time * 0.08) * 5,
            Math.sin(accent1Angle) * 50 + 50
        );
        
        const accent2Angle = time * 0.18;
        accentLight2.position.set(
            Math.cos(accent2Angle) * -50,
            -10 + Math.sin(time * 0.1) * 5,
            Math.sin(accent2Angle) * 50 + 50
        );
        
        // Subtle intensity pulsing for rim light
        rimLight.intensity = 2.8 + Math.sin(time * 0.3) * 0.25;
        
        // Animate top light intensity
        topLight.intensity = 2.5 + Math.cos(time * 0.2) * 0.2;
        
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
    
    // Initial render to ensure scene is visible immediately
    renderer.render(scene, camera);

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
