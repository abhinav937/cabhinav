import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Layout from './Layout';

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
      icon: 'work'
    },
    {
      path: '/publications',
      title: 'Publications',
      description: 'Academic publications and research papers',
      icon: 'article'
    },
    {
      path: '/strava',
      title: 'Strava',
      description: 'Running activities and performance metrics',
      icon: 'directions_run'
    },
    {
      path: '/chat',
      title: 'Chat',
      description: 'Interactive chat interface',
      icon: 'chat'
    },
    {
      path: '/space',
      title: 'Space',
      description: 'Interactive space background animation',
      icon: 'stars'
    },
    {
      path: '/latex',
      title: 'LaTeX',
      description: 'Professional resume and CV',
      icon: 'functions'
    },
    {
      path: '/cli',
      title: 'CLI Terminal',
      description: 'Web Serial Terminal for hardware communication',
      icon: 'terminal'
    },
    {
      path: '/ls',
      title: 'Site Directory',
      description: 'Complete directory of all site pages',
      icon: 'list'
    },
    {
      path: '/3d',
      title: '3D Demo',
      description: 'Interactive 3D graphics and animations',
      icon: 'view_in_ar'
    },
    {
      path: '/x',
      title: 'X (Twitter)',
      description: 'Social media and updates',
      icon: 'tag'
    },
  ];

  const externalLinks: PageLink[] = [
    {
      path: 'https://github.com/abhinav937',
      title: 'GitHub',
      description: 'Source code and development projects',
      icon: 'code',
      external: true,
      url: 'github.com/abhinav937'
    },
    {
      path: 'https://scholar.google.com/citations?user=40h4Uo8AAAAJ',
      title: 'Google Scholar',
      description: 'Academic publications and citations',
      icon: 'school',
      external: true,
      url: 'scholar.google.com'
    },
    {
      path: 'https://www.strava.com/athletes/99464226',
      title: 'Strava Profile',
      description: 'Complete running and fitness data',
      icon: 'directions_run',
      external: true,
      url: 'strava.com/athletes/99464226'
    }
  ];

  return (
    <Layout>
      <Helmet>
        <title>Site Directory - Abhinav Chinnusamy</title>
        <meta name="description" content="Directory of all pages and domains on cabhinav.com" />
        <link rel="canonical" href="https://cabhinav.com/ls/" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </Helmet>

      <div style={{ minHeight: '100vh', backgroundColor: '#000000' }}>
        {/* Header */}
        <header style={{ paddingTop: '5rem', paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: '700',
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, #ffffff, #f8f8f8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.025em'
            }}>
              Site Directory
            </h1>
            <p style={{
              fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
              color: '#a8a8a8',
              maxWidth: '48rem',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              All pages and domains on cabhinav.com
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '5rem' }}>
          <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
            {/* Main Domain Section */}
            <section style={{ marginBottom: '4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.875rem', color: '#60a5fa' }}>language</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffffff' }}>cabhinav.com</h2>
              </div>

              <div className="ls-grid ls-grid-main" style={{
                gap: '1.5rem'
              }}>
                {pages.map((page, index) => (
                  <Link
                    key={page.path}
                    to={page.path}
                    style={{
                      display: 'block',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #333333',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      transition: 'all 0.3s ease',
                      textDecoration: 'none',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#404040';
                      e.currentTarget.style.backgroundColor = '#141414';
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#333333';
                      e.currentTarget.style.backgroundColor = '#0a0a0a';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span className="material-symbols-outlined" style={{
                        fontSize: '1.5rem',
                        color: '#60a5fa',
                        transition: 'transform 0.2s ease'
                      }}>
                        {page.icon}
                      </span>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#f8f8f8',
                        transition: 'color 0.2s ease'
                      }}>
                        {page.title}
                      </h3>
                    </div>

                    <div style={{
                      fontSize: '0.875rem',
                      color: '#666666',
                      fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
                      marginBottom: '0.5rem'
                    }}>
                      cabhinav.com{page.path}/
                    </div>

                    <p style={{
                      fontSize: '0.875rem',
                      color: '#e6e6e6',
                      lineHeight: '1.5'
                    }}>
                      {page.description}
                    </p>

                    {/* Hover effect line */}
                    <div style={{
                      height: '2px',
                      backgroundColor: '#60a5fa',
                      transform: 'scaleX(0)',
                      transformOrigin: 'left',
                      transition: 'transform 0.3s ease',
                      marginTop: '1rem'
                    }}></div>
                  </Link>
                ))}
              </div>
            </section>

            {/* External Links Section */}
            <section style={{ marginBottom: '4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.875rem', color: '#60a5fa' }}>link</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffffff' }}>External Links</h2>
              </div>

              <div className="ls-grid ls-grid-external" style={{
                gap: '1.5rem'
              }}>
                {externalLinks.map((link, index) => (
                  <a
                    key={link.path}
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #333333',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      transition: 'all 0.3s ease',
                      textDecoration: 'none',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#404040';
                      e.currentTarget.style.backgroundColor = '#141414';
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#333333';
                      e.currentTarget.style.backgroundColor = '#0a0a0a';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span className="material-symbols-outlined" style={{
                        fontSize: '1.5rem',
                        color: '#60a5fa',
                        transition: 'transform 0.2s ease'
                      }}>
                        {link.icon}
                      </span>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#f8f8f8',
                        transition: 'color 0.2s ease'
                      }}>
                        {link.title}
                      </h3>
                    </div>

                    <div style={{
                      fontSize: '0.875rem',
                      color: '#666666',
                      fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
                      marginBottom: '0.5rem'
                    }}>
                      {link.url}
                    </div>

                    <p style={{
                      fontSize: '0.875rem',
                      color: '#e6e6e6',
                      lineHeight: '1.5'
                    }}>
                      {link.description}
                    </p>

                    {/* External link indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                      <div style={{
                        height: '2px',
                        backgroundColor: '#60a5fa',
                        transform: 'scaleX(0)',
                        transformOrigin: 'left',
                        transition: 'transform 0.3s ease',
                        flex: '1'
                      }}></div>
                      <span className="material-symbols-outlined" style={{
                        fontSize: '0.75rem',
                        color: '#666666',
                        marginLeft: '0.5rem'
                      }}>open_in_new</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* Stats Section */}
            <section style={{ textAlign: 'center' }}>
              <div style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #333333',
                borderRadius: '0.5rem',
                padding: '2rem',
                maxWidth: '28rem',
                margin: '0 auto',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1.5rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: '1.875rem',
                      fontWeight: '700',
                      color: '#60a5fa',
                      marginBottom: '0.25rem'
                    }}>
                      {pages.length + externalLinks.length}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#a8a8a8' }}>Total Links</div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '1.875rem',
                      fontWeight: '700',
                      color: '#60a5fa',
                      marginBottom: '0.25rem'
                    }}>
                      {pages.length}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#a8a8a8' }}>Site Pages</div>
                  </div>
                </div>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#666666',
                  marginTop: '1rem'
                }}>
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default LS;
