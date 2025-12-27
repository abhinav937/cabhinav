import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-links">
            <a
              href="https://x.com/emotor"
              target="_blank"
              className="footer-link"
              rel="noopener noreferrer"
              aria-label="X (Twitter) Profile"
            >
              <i className="bi bi-twitter-x" aria-hidden="true"></i>
            </a>
            <a
              href="https://github.com/abhinav937"
              target="_blank"
              className="footer-link"
              rel="noopener noreferrer"
              aria-label="GitHub Profile"
            >
              <i className="bi bi-github" aria-hidden="true"></i>
            </a>
            <a
              href="https://scholar.google.com/citations?user=40h4Uo8AAAAJ&hl=en"
              target="_blank"
              className="footer-link"
              rel="noopener noreferrer"
              aria-label="Google Scholar Profile"
            >
              <i className="bi bi-mortarboard-fill" aria-hidden="true"></i>
            </a>
            <a
              href="https://www.strava.com/athletes/99464226"
              target="_blank"
              className="footer-link"
              rel="noopener noreferrer"
              aria-label="Strava Profile"
            >
              <i className="bi bi-activity" aria-hidden="true"></i>
            </a>
          </div>
          <p className="footer-text">
            © 2025 Abhinav Chinnusamy. Power Electronics Engineer.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
