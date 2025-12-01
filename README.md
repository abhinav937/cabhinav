# Public Folder

This folder contains static assets that are served unchanged by the web server.

## Common Use Cases

- **Textures**: Image files for materials (`.jpg`, `.png`, `.webp`)
- **3D Models**: GLTF, OBJ, or other 3D model files
- **Audio**: Sound effects or background music
- **Other Assets**: Any static files your application needs

## Usage Example

To load a texture from this folder:

```javascript
import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('/texture.jpg');
```

To load a 3D model:

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('/models/scene.gltf', (gltf) => {
	scene.add(gltf.scene);
});
```

