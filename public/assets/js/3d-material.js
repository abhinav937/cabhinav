import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas'),
    antialias: true,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputEncoding = THREE.sRGBEncoding;

const loader = new FontLoader();
let textMesh;
let currentPreset = 'chrome';

const presets = {
    chrome: {
        roughness: 0.05,
        anisotropy: 0,
        ior: 2.95,
        clearcoat: 0,
        dispersion: 0,
        metalColor: [0.95, 0.95, 0.98]
    },
    gold: {
        roughness: 0.1,
        anisotropy: 0,
        ior: 0.47,
        clearcoat: 0,
        dispersion: 0,
        metalColor: [1.0, 0.766, 0.336]
    },
    copper: {
        roughness: 0.15,
        anisotropy: 0,
        ior: 0.46,
        clearcoat: 0,
        dispersion: 0,
        metalColor: [0.955, 0.637, 0.538]
    },
    aluminum: {
        roughness: 0.1,
        anisotropy: 0.8,
        ior: 1.39,
        clearcoat: 0,
        dispersion: 0,
        metalColor: [0.913, 0.921, 0.925]
    },
    titanium: {
        roughness: 0.2,
        anisotropy: 0.3,
        ior: 2.16,
        clearcoat: 0.1,
        dispersion: 0.05,
        metalColor: [0.542, 0.497, 0.449]
    },
    pearl: {
        roughness: 0.3,
        anisotropy: 0,
        ior: 1.7,
        clearcoat: 0.8,
        dispersion: 0.15,
        metalColor: [0.95, 0.95, 0.98]
    },
    diamond: {
        roughness: 0.01,
        anisotropy: 0,
        ior: 2.417,
        clearcoat: 1,
        dispersion: 0.3,
        metalColor: [0.98, 0.98, 1.0]
    },
    'car-paint': {
        roughness: 0.2,
        anisotropy: 0,
        ior: 1.5,
        clearcoat: 1,
        dispersion: 0.02,
        metalColor: [0.1, 0.1, 0.5]
    },
    custom: {
        roughness: 0.5,
        anisotropy: 0.5,
        ior: 1.5,
        clearcoat: 0.5,
        dispersion: 0.1,
        metalColor: [0.95, 0.95, 0.98]
    }
};

const materialUniforms = {
    time: { value: 0 },
    mousePosition: { value: new THREE.Vector2(0.5, 0.5) },
    roughness: { value: 0.05 },
    anisotropy: { value: 0.0 },
    ior: { value: 2.95 },
    clearcoat: { value: 0.0 },
    dispersion: { value: 0.0 },
    metalColor: { value: new THREE.Vector3(0.95, 0.95, 0.98) },
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
        uniform vec2 mousePosition;
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

            vec3 lightPos1 = vec3(
                (mousePosition.x - 0.5) * 100.0,
                (mousePosition.y - 0.5) * 100.0,
                5.0
            );
            // Four moving lights orbiting around the equator (horizontal plane)
            float orbitRadius = 80.0;  // Larger radius for more visibility
            float orbitSpeed = 1.0;     // Faster rotation
            float orbitHeight = 0.0;    // Keep at equator (Y = 0)
            
            // Light 2: Rotating around equator, starting at 0 degrees
            vec3 lightPos2 = vec3(
                cos(time * orbitSpeed) * orbitRadius,
                orbitHeight,
                sin(time * orbitSpeed) * orbitRadius
            );
            
            // Light 3: Rotating around equator, 90 degrees offset
            vec3 lightPos3 = vec3(
                cos(time * orbitSpeed + 1.57) * orbitRadius,
                orbitHeight,
                sin(time * orbitSpeed + 1.57) * orbitRadius
            );
            
            // Light 4: Rotating around equator, 180 degrees offset
            vec3 lightPos4 = vec3(
                cos(time * orbitSpeed + 3.14) * orbitRadius,
                orbitHeight,
                sin(time * orbitSpeed + 3.14) * orbitRadius
            );
            
            // Light 5: Rotating around equator, 270 degrees offset
            vec3 lightPos5 = vec3(
                cos(time * orbitSpeed + 4.71) * orbitRadius,
                orbitHeight,
                sin(time * orbitSpeed + 4.71) * orbitRadius
            );

            vec3 color = vec3(0.0);

            vec3 lights[5];
            lights[0] = lightPos1;
            lights[1] = lightPos2;
            lights[2] = lightPos3;
            lights[3] = lightPos4;
            lights[4] = lightPos5;

            vec3 lightColors[5];
            lightColors[0] = lightTemperature;
            lightColors[1] = vec3(0.5, 0.5, 0.7) * lightTemperature;  // Top-left: blue tint
            lightColors[2] = vec3(0.7, 0.5, 0.5) * lightTemperature;  // Top-right: red tint
            lightColors[3] = vec3(0.5, 0.7, 0.5) * lightTemperature;  // Bottom-left: green tint
            lightColors[4] = vec3(0.7, 0.7, 0.5) * lightTemperature;  // Bottom-right: yellow tint

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
                color += (kD * metalColor / 3.14159265359 + specular) * lightColors[i] * NdotL;
            }

            if(clearcoat > 0.0) {
                vec3 clearcoatNormal = normal;
                float clearcoatRoughness = 0.04;

                for(int i = 0; i < 1; i++) {
                    vec3 lightDir = normalize(lights[i] - vWorldPosition);
                    vec3 halfwayDir = normalize(lightDir + viewDir);

                    float D = distributionGGX(clearcoatNormal, halfwayDir, clearcoatRoughness);
                    float G = geometrySmith(clearcoatNormal, viewDir, lightDir, clearcoatRoughness);
                    vec3 F = fresnelSchlick(max(dot(halfwayDir, viewDir), 0.0), vec3(0.04));

                    vec3 clearcoatSpecular = D * G * F / (4.0 * max(dot(clearcoatNormal, viewDir), 0.0) * max(dot(clearcoatNormal, lightDir), 0.0) + 0.0001);
                    float NdotL = max(dot(clearcoatNormal, lightDir), 0.0);

                    color += clearcoatSpecular * clearcoat * NdotL * lightTemperature;
                }
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

loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
    // Responsive text size for mobile and desktop
    const isMobile = window.innerWidth <= 768;
    // Calculate text size based on viewport width
    const viewportWidth = window.innerWidth;
    const textSize = isMobile ? Math.min(0.4, viewportWidth * 0.001) : 1.5;
    const textDepth = isMobile ? 0.1 : 0.375;
    const bevelThickness = isMobile ? 0.01 : 0.0375;
    const bevelSize = isMobile ? 0.01 : 0.0375;
    
    const textGeometry = new TextGeometry('Abhinav\nChinnusamy', {
        font: font,
        size: textSize,
        depth: textDepth,
        curveSegments: isMobile ? 8 : 32,
        bevelEnabled: true,
        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelSegments: isMobile ? 4 : 16
    });
    textGeometry.center();
    textGeometry.computeVertexNormals();
    
    // Calculate bounding box to ensure text fits
    textGeometry.computeBoundingBox();
    const boundingBox = textGeometry.boundingBox;
    const textWidth = boundingBox.max.x - boundingBox.min.x;
    const textHeight = boundingBox.max.y - boundingBox.min.y;
    
    // Scale down if text is too wide for mobile
    if (isMobile && textWidth > viewportWidth * 0.8) {
        const scaleFactor = (viewportWidth * 0.8) / textWidth;
        textMesh = new THREE.Mesh(textGeometry, customMaterial);
        textMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
    } else {
        textMesh = new THREE.Mesh(textGeometry, customMaterial);
    }
    
    textMesh.position.x = 0;  // Centered
    textMesh.position.y = 0;  // Centered vertically
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
const isMobile = window.innerWidth <= 768;
camera.position.z = isMobile ? 3.5 : 10;  // Closer on mobile for better fit
camera.position.y = isMobile ? 0.3 : 0;  // Slightly higher on mobile

function applyPreset(presetName) {
    const preset = presets[presetName];
    materialUniforms.roughness.value = preset.roughness;
    materialUniforms.anisotropy.value = preset.anisotropy;
    materialUniforms.ior.value = preset.ior;
    materialUniforms.clearcoat.value = preset.clearcoat;
    materialUniforms.dispersion.value = preset.dispersion;
    materialUniforms.metalColor.value = new THREE.Vector3(...preset.metalColor);
    document.getElementById('roughness').value = preset.roughness;
    document.getElementById('anisotropy').value = preset.anisotropy;
    document.getElementById('ior').value = preset.ior;
    document.getElementById('clearcoat').value = preset.clearcoat;
    document.getElementById('dispersion').value = preset.dispersion;
    document.getElementById('roughness-val').textContent = preset.roughness;
    document.getElementById('anisotropy-val').textContent = preset.anisotropy;
    document.getElementById('ior-val').textContent = preset.ior.toFixed(2);
    document.getElementById('clearcoat-val').textContent = preset.clearcoat;
    document.getElementById('dispersion-val').textContent = preset.dispersion.toFixed(2);
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-preset="${presetName}"]`).classList.add('active');
    currentPreset = presetName;
}

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
});
applyPreset('chrome');

const controls = document.querySelector('.controls');
controls.addEventListener('mousedown', e => e.stopPropagation());
controls.addEventListener('mousemove', e => e.stopPropagation());

document.getElementById('roughness').addEventListener('input', (e) => {
    materialUniforms.roughness.value = parseFloat(e.target.value);
    document.getElementById('roughness-val').textContent = e.target.value;
    currentPreset = 'custom';
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-preset="custom"]').classList.add('active');
});

document.getElementById('anisotropy').addEventListener('input', (e) => {
    materialUniforms.anisotropy.value = parseFloat(e.target.value);
    document.getElementById('anisotropy-val').textContent = e.target.value;
    currentPreset = 'custom';
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-preset="custom"]').classList.add('active');
});

document.getElementById('ior').addEventListener('input', (e) => {
    materialUniforms.ior.value = parseFloat(e.target.value);
    document.getElementById('ior-val').textContent = e.target.value;
    currentPreset = 'custom';
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-preset="custom"]').classList.add('active');
});

document.getElementById('clearcoat').addEventListener('input', (e) => {
    materialUniforms.clearcoat.value = parseFloat(e.target.value);
    document.getElementById('clearcoat-val').textContent = e.target.value;
    currentPreset = 'custom';
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-preset="custom"]').classList.add('active');
});

document.getElementById('dispersion').addEventListener('input', (e) => {
    materialUniforms.dispersion.value = parseFloat(e.target.value);
    document.getElementById('dispersion-val').textContent = e.target.value;
    currentPreset = 'custom';
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-preset="custom"]').classList.add('active');
});

function kelvinToRGB(kelvin) {
    const temp = kelvin / 100;
    let r, g, b;
    if (temp <= 66) {
        r = 255;
        g = temp;
        g = 99.4708025861 * Math.log(g) - 161.1195681661;
        if (temp <= 19) {
            b = 0;
        } else {
            b = temp - 10;
            b = 138.5177312231 * Math.log(b) - 305.0447927307;
        }
    } else {
        r = temp - 60;
        r = 329.698727446 * Math.pow(r, -0.1332047592);
        g = temp - 60;
        g = 288.1221695283 * Math.pow(g, -0.0755148492);
        b = 255;
    }
    return new THREE.Vector3(
        Math.max(0, Math.min(255, r)) / 255,
        Math.max(0, Math.min(255, g)) / 255,
        Math.max(0, Math.min(255, b)) / 255
    );
}

document.getElementById('temperature').addEventListener('input', (e) => {
    const kelvin = parseInt(e.target.value);
    materialUniforms.lightTemperature.value = kelvinToRGB(kelvin);
    document.getElementById('temp-val').textContent = kelvin + 'K';
});

document.getElementById('export').addEventListener('click', () => {
    const values = {
        preset: currentPreset,
        roughness: materialUniforms.roughness.value,
        anisotropy: materialUniforms.anisotropy.value,
        ior: materialUniforms.ior.value,
        clearcoat: materialUniforms.clearcoat.value,
        dispersion: materialUniforms.dispersion.value
    };
    navigator.clipboard.writeText(JSON.stringify(values, null, 2));
    const copied = document.getElementById('copied');
    copied.classList.add('show');
    setTimeout(() => copied.classList.remove('show'), 2000);
});

const mouse = new THREE.Vector2();
let targetRotationX = 0;
let targetRotationY = 0;
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let isCtrlPressed = false;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Meta' || e.key === 'Control') isCtrlPressed = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Meta' || e.key === 'Control') isCtrlPressed = false;
});

// Mouse events
document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.controls')) {
        isDragging = true;
    }
});

document.addEventListener('mouseup', () => isDragging = false);

document.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX / window.innerWidth;
    mouse.y = event.clientY / window.innerHeight;
    if (isDragging && !event.target.closest('.controls')) {
        const deltaX = event.clientX - previousMouseX;
        const deltaY = event.clientY - previousMouseY;
        if (isCtrlPressed) {
            materialUniforms.mousePosition.value = mouse;
        } else {
            targetRotationY += deltaX * 0.01;
            targetRotationX += deltaY * 0.01;
        }
    }
    if (!isDragging && !isCtrlPressed) {
        materialUniforms.mousePosition.value = mouse;
    }
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
});

// Touch events for mobile
let touchStartX = 0;
let touchStartY = 0;
let isTouching = false;

document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.controls')) {
        isTouching = true;
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        previousMouseX = touch.clientX;
        previousMouseY = touch.clientY;
    }
}, { passive: true });

document.addEventListener('touchend', () => {
    isTouching = false;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (isTouching && !e.target.closest('.controls')) {
        const touch = e.touches[0];
        mouse.x = touch.clientX / window.innerWidth;
        mouse.y = touch.clientY / window.innerHeight;
        
        const deltaX = touch.clientX - previousMouseX;
        const deltaY = touch.clientY - previousMouseY;
        
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        materialUniforms.mousePosition.value = mouse;
        
        previousMouseX = touch.clientX;
        previousMouseY = touch.clientY;
    }
}, { passive: true });

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
    const isMobile = window.innerWidth <= 768;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Adjust camera distance and position for mobile
    if (isMobile) {
        camera.position.z = 3.5;  // Closer on mobile
        camera.position.y = 0.3;   // Slightly higher
    } else {
        camera.position.z = 10;
        camera.position.y = 0;
    }
    
    // Recalculate text size if needed
    if (textMesh && isMobile) {
        const viewportWidth = window.innerWidth;
        const textGeometry = textMesh.geometry;
        textGeometry.computeBoundingBox();
        const boundingBox = textGeometry.boundingBox;
        const textWidth = boundingBox.max.x - boundingBox.min.x;
        
        if (textWidth > viewportWidth * 0.8) {
            const scaleFactor = (viewportWidth * 0.8) / textWidth;
            textMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }
    }
    
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
