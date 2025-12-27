import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

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

      {/* Main Content */}
      <main style={isHomePage ? {} : { flex: '1' }}>
        {children}
      </main>

      {/* Footer */}
      {!isHomePage && (
        <footer className="footer">
          <div className="text-center">
            <small className="copyright">© 2025 Abhinav Chinnusamy. All rights reserved. Unauthorized use and/or duplication of this material without express and written permission from the author and/or owner is strictly prohibited.</small>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
