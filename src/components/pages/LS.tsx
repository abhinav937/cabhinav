import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Footer from '../ui/Footer';

interface PageLink {
  path: string;
  title: string;
  description: string;
  icon: string;
  external?: boolean;
  url?: string;
}

const LS: React.FC = () => {
  const pages: PageLink[] = [
    {
      path: '/projects',
      title: 'Projects',
      description: 'Featured power electronics projects',
      icon: 'bi-briefcase'
    },
    {
      path: '/publications',
      title: 'Publications',
      description: 'Academic publications and research papers',
      icon: 'bi-file-earmark-text'
    },
    {
      path: '/strava',
      title: 'Strava',
      description: 'Running activities and performance metrics',
      icon: 'bi-activity'
    },
    {
      path: '/chat',
      title: 'Chat',
      description: 'Interactive chat interface',
      icon: 'bi-chat'
    },
    {
      path: '/space',
      title: 'Space',
      description: 'Interactive space background animation',
      icon: 'bi-stars'
    },
    {
      path: '/latex',
      title: 'LaTeX',
      description: 'Professional resume and CV',
      icon: 'bi-calculator'
    },
    {
      path: '/cli',
      title: 'CLI Terminal',
      description: 'Web Serial Terminal for hardware communication',
      icon: 'bi-terminal'
    },
    {
      path: '/ls',
      title: 'Site Directory',
      description: 'Complete directory of all site pages',
      icon: 'bi-list'
    },
    {
      path: '/3d',
      title: '3D Demo',
      description: 'Interactive 3D graphics and animations',
      icon: 'bi-box'
    },
    {
      path: '/x',
      title: 'X (Twitter)',
      description: 'Social media and updates',
      icon: 'bi-twitter-x'
    },
  ];

  const externalLinks: PageLink[] = [
    {
      path: 'https://github.com/abhinav937',
      title: 'GitHub',
      description: 'Source code and development projects',
      icon: 'bi-github',
      external: true,
      url: 'github.com/abhinav937'
    },
    {
      path: 'https://scholar.google.com/citations?user=40h4Uo8AAAAJ',
      title: 'Google Scholar',
      description: 'Academic publications and citations',
      icon: 'bi-mortarboard-fill',
      external: true,
      url: 'scholar.google.com'
    },
    {
      path: 'https://www.strava.com/athletes/99464226',
      title: 'Strava Profile',
      description: 'Complete running and fitness data',
      icon: 'bi-activity',
      external: true,
      url: 'strava.com/athletes/99464226'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Site Directory - Abhinav Chinnusamy</title>
        <meta name="description" content="Directory of all pages and domains on cabhinav.com" />
        <link rel="canonical" href="https://cabhinav.com/ls/" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        <link rel="stylesheet" href="/assets/css/grok-style.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" />
      </Helmet>
      <div className="h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <header className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Site Directory
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              All pages and domains on cabhinav.com
            </p>
          </div>
        </header>

        {/* Main Content - Flexible to push footer down */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            {/* Main Domain Section */}
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <span className="bi bi-globe text-3xl text-blue-400"></span>
                <h2 className="text-2xl font-bold text-white">cabhinav.com</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages.map((page, index) => (
                  <Link
                    key={page.path}
                    to={page.path}
                    className="block bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-700 hover:border-gray-600 transition-all duration-200 text-white no-underline"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`bi text-xl text-blue-400 ${page.icon}`}></span>
                      <h3 className="text-lg font-semibold text-white">
                        {page.title}
                      </h3>
                    </div>

                    <p className="text-sm text-gray-300 leading-relaxed">
                      {page.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* External Links Section */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-8">
                <span className="bi bi-link text-3xl text-blue-400"></span>
                <h2 className="text-2xl font-bold text-white">External Links</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {externalLinks.map((link, index) => (
                  <a
                    key={link.path}
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-700 hover:border-gray-600 transition-all duration-200 text-white no-underline"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`bi text-xl text-blue-400 ${link.icon}`}></span>
                      <h3 className="text-lg font-semibold text-white">
                        {link.title}
                      </h3>
                    </div>

                    <p className="text-sm text-gray-300 leading-relaxed">
                      {link.description}
                    </p>
                  </a>
                ))}
              </div>
            </section>

            {/* Stats Section */}
            <section className="text-center mt-16">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md mx-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      {pages.length + externalLinks.length}
                    </div>
                    <div className="text-sm text-gray-400">Total Links</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      {pages.length}
                    </div>
                    <div className="text-sm text-gray-400">Site Pages</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* Fixed Footer at Bottom */}
        <footer className="mt-auto">
          <Footer />
        </footer>
      </div>
    </>
  );
};

export default LS;
