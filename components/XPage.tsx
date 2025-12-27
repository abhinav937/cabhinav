import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from './Layout';

const XPage: React.FC = () => {
  useEffect(() => {
    // Redirect to X/Twitter profile
    window.location.replace("https://x.com/emotor");
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>X (Twitter) - Abhinav Chinnusamy</title>
        <meta name="description" content="Follow Abhinav Chinnusamy on X (Twitter) for updates and discussions." />
        <link rel="canonical" href="https://x.com/emotor" />
      </Helmet>

      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-text-secondary">
            Redirecting to X...
          </p>
          <p className="text-sm text-text-muted">
            If you are not redirected automatically,{' '}
            <a
              href="https://x.com/emotor"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              click here
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default XPage;
