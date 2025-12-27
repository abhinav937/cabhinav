import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/projects', label: 'Projects', icon: 'work' },
    { path: '/publications', label: 'Publications', icon: 'article' },
    { path: '/strava', label: 'Strava', icon: 'directions_run' },
    { path: '/chat', label: 'Chat', icon: 'chat' },
  ];

  return (
    <nav className="desktop-nav-bar">
      <div className="desktop-nav-segment">
        <div className="desktop-nav-icon-container">
          <span className="material-symbols-rounded">engineering</span>
        </div>
        <span className="desktop-nav-label-text">Abhinav Chinnusamy</span>
      </div>

      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`desktop-nav-segment ${location.pathname === item.path ? 'active' : ''}`}
          data-nav-link
        >
          <div className="desktop-nav-state-layer">
            <span className="material-symbols-rounded">{item.icon}</span>
          </div>
          <span className="desktop-nav-label-text">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};
