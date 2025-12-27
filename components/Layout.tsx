import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, description }) => {
  const location = useLocation();


  const isHomePage = location.pathname === '/';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </Helmet>

      {/* Main Content */}
      <main style={isHomePage ? {} : { flex: '1' }}>
        {children}
      </main>

      {/* Footer */}
      {!isHomePage && (
        <footer style={{
          backgroundColor: '#0a0a0a',
          borderTop: '1px solid #333333',
          marginTop: 'auto'
        }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <a
                  href="https://x.com/emotor"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#a8a8a8',
                    transition: 'color 0.2s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#a8a8a8'; }}
                  aria-label="X (Twitter) Profile"
                >
                  <img
                    src="/assets/images/social/x-svg.svg"
                    alt="X (Twitter)"
                    style={{ width: '1.25rem', height: '1.25rem' }}
                  />
                </a>
                <a
                  href="https://github.com/abhinav937"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#a8a8a8',
                    transition: 'color 0.2s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#a8a8a8'; }}
                  aria-label="GitHub Profile"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>code</span>
                </a>
                <a
                  href="https://scholar.google.com/citations?user=40h4Uo8AAAAJ&hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#a8a8a8',
                    transition: 'color 0.2s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#a8a8a8'; }}
                  aria-label="Google Scholar Profile"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>school</span>
                </a>
                <a
                  href="https://www.strava.com/athletes/99464226"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#a8a8a8',
                    transition: 'color 0.2s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#a8a8a8'; }}
                  aria-label="Strava Profile"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>directions_run</span>
                </a>
              </div>
              <p style={{ color: '#a8a8a8', fontSize: '0.875rem' }}>
                © 2025 Abhinav Chinnusamy. Power Electronics Engineer.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
