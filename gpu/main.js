import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a); // Dark background

// Get viewport dimensions
const width = window.innerWidth;
const height = window.innerHeight;

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
camera.position.z = 4;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);

// Try to find the app element, fallback to body if not found
const appElement = document.querySelector('#app');
if (appElement) {
    appElement.appendChild(renderer.domElement);
} else {
    document.body.appendChild(renderer.domElement);
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Create particle system
const count = 1500;
const positions = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 6; // x
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6; // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6; // z
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
    color: 0x9bdc6e, // Green color
    size: 0.03,
    sizeAttenuation: true
});

const points = new THREE.Points(geometry, material);
scene.add(points);

// Add some lighting for visual interest
const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x9bdc6e, 1, 100);
pointLight.position.set(2, 2, 2);
scene.add(pointLight);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the particle system
    points.rotation.y += 0.002;

    // Add some floating motion
    points.position.y = Math.sin(Date.now() * 0.001) * 0.1;

    controls.update();
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(newWidth, newHeight);
});

// Add some info text
const infoDiv = document.createElement('div');
infoDiv.style.position = 'absolute';
infoDiv.style.top = '10px';
infoDiv.style.left = '10px';
infoDiv.style.color = 'white';
infoDiv.style.fontFamily = 'Arial, sans-serif';
infoDiv.style.fontSize = '14px';
infoDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
infoDiv.style.padding = '10px';
infoDiv.style.borderRadius = '5px';
infoDiv.innerHTML = `
    <strong>Particle System Demo</strong><br>
    • 1,500 particles in 3D space<br>
    • Mouse: Orbit camera<br>
    • Scroll: Zoom in/out<br>
    • Right-click: Pan view
`;
document.body.appendChild(infoDiv);