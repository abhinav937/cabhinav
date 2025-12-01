# three.js WebGPU Demo

An interactive 3D scene showcasing WebGPU capabilities using three.js.

## Features

- Multiple 3D geometries (Box, Sphere, Cylinder, Cone, Torus, Octahedron)
- Real-time lighting with shadows (Ambient, Directional, Point, Spot lights)
- Interactive controls (animation toggle, shadows, light helpers, background color)
- Dynamic object management (add/remove objects)
- Performance monitoring (FPS counter)
- Responsive design

## Installation

### Option 1: Using npm and Vite (Recommended)

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will open at `http://localhost:5173`

3. Build for production:
```bash
npm run build
```

### Option 2: Using CDN (No build tools)

1. Start a local server:
```bash
npx serve .
```

2. Open the URL shown in your terminal (usually `http://localhost:3000`)

## Browser Requirements

WebGPU is supported in:
- Chrome 113+
- Edge 113+
- Safari 18+

## Project Structure

```
gpu/
├── index.html      # Main HTML file
├── main.js         # JavaScript code
├── style.css       # Styles
├── package.json    # npm dependencies
├── vite.config.js  # Vite configuration
└── public/         # Static assets (textures, models, etc.)
```

## Controls

- **Mouse drag**: Rotate camera
- **Scroll**: Zoom in/out
- **Animate Objects**: Toggle object rotation
- **Shadows**: Toggle shadow rendering
- **Show Helpers**: Toggle light helper visualization
- **Background Color**: Change scene background
- **Add Random Object**: Add a new random 3D object
- **Reset Scene**: Reset to initial state

## Resources

- [three.js Manual](https://threejs.org/manual/)
- [three.js Documentation](https://threejs.org/docs/)
- [WebGPU Specification](https://www.w3.org/TR/webgpu/)

