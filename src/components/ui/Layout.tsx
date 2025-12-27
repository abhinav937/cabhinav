import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Footer from './Footer';

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
      position: 'relative'
    }}>
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </Helmet>

      {/* Main Content */}
      <main style={{ paddingBottom: '6rem' }}>
        {children}
      </main>

      {/* Footer Overlay */}
      <div className="homepage-footer-overlay">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
