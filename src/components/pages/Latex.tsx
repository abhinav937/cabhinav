import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '../ui/Layout';

const Latex: React.FC = () => {
  useEffect(() => {
    // Redirect to external LaTeX site
    window.location.replace("https://latex.cabhinav.com");
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>Resume - Abhinav Chinnusamy</title>
        <meta name="description" content="Professional resume and CV of Abhinav Chinnusamy, Power Electronics Engineer." />
        <link rel="canonical" href="https://latex.cabhinav.com/" />
        <script src="/assets/js/resumeViewer.js"></script>
      </Helmet>

      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-text-secondary">
            Redirecting to resume...
          </p>
          <p className="text-sm text-text-muted">
            If you are not redirected automatically,{' '}
            <a
              href="https://latex.cabhinav.com"
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

export default Latex;
