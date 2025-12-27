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
      <main style={isHomePage ? {} : { flex: '1', paddingBottom: '6rem' }}>
        {children}
      </main>

      {/* Footer - Fixed at bottom */}
      {!isHomePage && (
        <footer style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          backgroundColor: '#0a0a0a',
          borderTop: '1px solid #333333',
          zIndex: '1000',
          padding: '1rem'
        }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <a
                  href="https://x.com/emotor"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#a8a8a8',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none',
                    padding: '0.5rem',
                    borderRadius: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#60a5fa';
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#a8a8a8';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
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
                    transition: 'all 0.3s ease',
                    textDecoration: 'none',
                    padding: '0.5rem',
                    borderRadius: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#60a5fa';
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#a8a8a8';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
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
                    transition: 'all 0.3s ease',
                    textDecoration: 'none',
                    padding: '0.5rem',
                    borderRadius: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#60a5fa';
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#a8a8a8';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
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
                    transition: 'all 0.3s ease',
                    textDecoration: 'none',
                    padding: '0.5rem',
                    borderRadius: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#60a5fa';
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#a8a8a8';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Strava Profile"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>directions_run</span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
