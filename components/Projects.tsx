import React, { useState, useMemo } from 'react';
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
  // Add more projects as needed
];

const Projects: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // React hooks for filtering and searching
  const filteredProjects = useMemo(() => {
    return PROJECTS.filter(project => {
      const matchesFilter = filter === 'all' || project.techStack.includes(filter);
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchTerm]);

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

            {/* Search and filter controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-900/50 transition-colors"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-900/50 transition-colors"
              >
                <option value="all">All Technologies</option>
                <option value="GaN">GaN</option>
                <option value="SiC">SiC</option>
                <option value="RP2040">RP2040</option>
                <option value="FPGA">FPGA</option>
              </select>
            </div>
          </div>
        </header>

        {/* Projects grid */}
        <main className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredProjects.map(project => (
                <article key={project.id} className="card group hover:scale-105 transition-transform duration-300">
                  {/* Project image */}
                  <div className="relative overflow-hidden rounded-t-lg bg-bg-secondary">
                    <img
                      src={project.image}
                      alt={project.alt}
                      loading="lazy"
                      className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Project content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-gray-100 group-hover:text-blue-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-text-secondary mb-4 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Project links */}
                    <div className="flex gap-3">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-bg-elevated hover:bg-accent-muted text-text-primary rounded-lg transition-colors duration-200"
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
                          className="inline-flex items-center gap-2 px-4 py-2 bg-bg-elevated hover:bg-accent-muted text-text-primary rounded-lg transition-colors duration-200"
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
                          className="inline-flex items-center gap-2 px-4 py-2 bg-bg-elevated hover:bg-accent-muted text-text-primary rounded-lg transition-colors duration-200"
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

            {/* No results message */}
            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-text-muted text-lg">
                  No projects found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default Projects;
