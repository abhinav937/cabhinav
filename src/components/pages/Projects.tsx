import React from 'react';
import { Helmet } from 'react-helmet-async';
import Footer from '../ui/Footer';

// TypeScript interfaces for type safety
interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  techStack: string[];
  github?: string;
  demo?: string;
  paper?: string;
}

// Your existing data, now properly typed
const PROJECTS: Project[] = [
  {
    id: 'yeswegan',
    title: 'YesWeGaN',
    description: '3-Phase GaN Inverter',
    image: '/assets/images/projects/yeswegan1.JPEG',
    alt: 'YesWeGaN 3-Phase GaN Inverter',
    techStack: ['GaN', 'FPGA', 'Power'],
  },
  {
    id: 'gan-half-bridge',
    title: 'GaN Half-Bridge Inverter',
    description: 'High-frequency GaN half-bridge inverter',
    image: '/assets/images/projects/gan.webp',
    alt: 'GaN Half Bridge inverter',
    techStack: ['GaN', 'Half-Bridge', 'High-Freq'],
  },
  {
    id: 'sic-sscb',
    title: 'SiC Solid State Circuit Breaker',
    description: 'Modular SiC-based solid state circuit breaker',
    image: '/assets/images/projects/modular-sscb.webp',
    alt: 'SiC Solid State Circuit Breaker',
    techStack: ['SiC', 'SSCB', 'Modular'],
  },
  {
    id: 'opa-v2',
    title: 'OPA v2',
    description: 'Operational Amplifier Design and Analysis',
    image: '/assets/images/projects/opav2.webp',
    alt: 'Operational Amplifier v2',
    techStack: ['Analog', 'OpAmp', 'Design'],
  },
  {
    id: 'rp2-embedded',
    title: 'RP2040 Embedded System',
    description: 'Raspberry Pi Pico based embedded project',
    image: '/assets/images/projects/rp2.webp',
    alt: 'RP2040 Embedded System',
    techStack: ['RP2040', 'Embedded', 'Microcontroller'],
  },
  {
    id: 'sos-system',
    title: 'SOS Communication System',
    description: 'Emergency communication and signaling system',
    image: '/assets/images/projects/sos_1.webp',
    alt: 'SOS Communication System',
    techStack: ['Communication', 'Embedded', 'RF'],
  },
];

const Projects = () => {

  return (
    <>
      <Helmet>
        <title>Projects - Abhinav Chinnusamy</title>
        <meta name="description" content="Explore my projects in power electronics, embedded systems, and hardware design." />
        <link rel="canonical" href="https://cabhinav.com/projects/" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        <link rel="stylesheet" href="/assets/css/grok-style.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" />
      </Helmet>

      <div
        className="app-container"
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#050505'
        }}
      >
        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 pb-20" style={{ overflowY: 'auto', height: 'calc(100vh - 100px)' }}>
          {/* Header */}
          <header className="pt-20 pb-12">
            <div className="max-w-6xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-br from-white to-gray-200 bg-clip-text text-transparent tracking-tight">
                My Projects
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Explore my work in power electronics, embedded systems, and hardware design
              </p>
            </div>
          </header>

          {/* Projects Grid */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PROJECTS.map(project => (
                <article key={project.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/50 hover:border-gray-600 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-gray-900/20 transition-all duration-300 group">
                  {/* Project image */}
                  <div className="relative overflow-hidden bg-gray-900 rounded-lg mb-4">
                    <img
                      src={project.image}
                      alt={project.alt}
                      loading="lazy"
                      className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-300 rounded-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Project content */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bi bi-cpu text-2xl text-blue-400 transition-transform duration-200 group-hover:scale-110"></span>
                    <h3 className="text-lg font-semibold text-gray-100 transition-colors duration-200 group-hover:text-white">
                      {project.title}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-300 leading-relaxed mb-4">
                    {project.description}
                  </p>

                  {/* Project links */}
                  <div className="flex gap-3">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors duration-200 hover:shadow-lg hover:shadow-gray-900/20"
                      >
                        <span className="bi bi-github text-sm"></span>
                        Code
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors duration-200 hover:shadow-lg hover:shadow-gray-900/20"
                      >
                        <span className="bi bi-box-arrow-up-right text-sm"></span>
                        Demo
                      </a>
                    )}
                    {project.paper && (
                      <a
                        href={project.paper}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors duration-200 hover:shadow-lg hover:shadow-gray-900/20"
                      >
                        <span className="bi bi-file-earmark-text text-sm"></span>
                        Paper
                      </a>
                    )}
                  </div>

                  {/* Hover effect line */}
                  <div style={{
                    height: '2px',
                    backgroundColor: '#60a5fa',
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.3s ease',
                    marginTop: '1rem'
                  }}></div>
                </article>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Footer Overlay */}
      <div className="homepage-footer-overlay">
        <Footer />
      </div>
    </>
  );
};

export default Projects;
