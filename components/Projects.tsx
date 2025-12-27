import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from './Layout';

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

const Projects: React.FC = () => {

  return (
    <Layout>
      <Helmet>
        <title>Projects - Abhinav Chinnusamy</title>
        <meta name="description" content="Explore my projects in power electronics, embedded systems, and hardware design." />
      </Helmet>

      {/* Main container with responsive padding */}
      <div className="min-h-screen bg-bg-primary text-text-primary">
        {/* Header section */}
        <header className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gradient">
              My Projects
            </h1>
            <p className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto mb-8">
              Explore my work in power electronics, embedded systems, and hardware design
            </p>
          </div>
        </header>

        {/* Projects grid */}
        <main className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {PROJECTS.map(project => (
                <article key={project.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-105 border border-gray-700">
                  {/* Project image */}
                  <div className="relative overflow-hidden bg-gray-900">
                    <img
                      src={project.image}
                      alt={project.alt}
                      loading="lazy"
                      className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Project content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-gray-100 group-hover:text-gray-300 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-gray-400 mb-4 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Project links */}
                    <div className="flex gap-3">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors duration-200"
                        >
                          <span className="material-symbols-outlined text-sm">code</span>
                          Code
                        </a>
                      )}
                      {project.demo && (
                        <a
                          href={project.demo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors duration-200"
                        >
                          <span className="material-symbols-outlined text-sm">launch</span>
                          Demo
                        </a>
                      )}
                      {project.paper && (
                        <a
                          href={project.paper}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors duration-200"
                        >
                          <span className="material-symbols-outlined text-sm">article</span>
                          Paper
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default Projects;
