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
        <title>LaTeX to SVG Converter - Abhinav Chinnusamy | Math Equation Renderer</title>
        
        {/* SEO Meta Tags */}
        <meta name="description" content="LaTeX to SVG converter tool for rendering mathematical equations, formulas, and scientific notation. Convert LaTeX code to high-quality SVG images for documents and presentations." />
        <meta name="keywords" content="LaTeX to SVG, LaTeX Converter, Math Equation Renderer, SVG Generator, Mathematical Notation, LaTeX Renderer, Equation Converter, Math SVG, Scientific Notation" />
        <meta name="author" content="Abhinav Chinnusamy" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        
        {/* Geo-location Tags */}
        <meta name="geo.region" content="US-WI" />
        <meta name="geo.placename" content="Madison, Wisconsin" />
        <meta name="geo.position" content="43.0731;-89.4012" />
        <meta name="ICBM" content="43.0731, -89.4012" />
        
        {/* Language Targeting */}
        <link rel="alternate" hreflang="en-US" href="https://cabhinav.com/latex/" />
        <link rel="alternate" hreflang="x-default" href="https://cabhinav.com/latex/" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="LaTeX to SVG Converter - Abhinav Chinnusamy" />
        <meta property="og:description" content="LaTeX to SVG converter tool for rendering mathematical equations, formulas, and scientific notation. Convert LaTeX code to high-quality SVG images." />
        <meta property="og:url" content="https://cabhinav.com/latex/" />
        <meta property="og:image" content="https://cabhinav.com/assets/images/profile/my_profile.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Abhinav Chinnusamy Professional Profile" />
        <meta property="og:site_name" content="cabhinav.com" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@emotor" />
        <meta name="twitter:creator" content="@emotor" />
        <meta name="twitter:title" content="LaTeX to SVG Converter - Abhinav Chinnusamy" />
        <meta name="twitter:description" content="Convert LaTeX equations to SVG format for documents and presentations" />
        <meta name="twitter:image" content="https://cabhinav.com/assets/images/profile/my_profile.jpg" />
        <meta name="twitter:image:alt" content="Abhinav Chinnusamy Resume" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://latex.cabhinav.com/" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#050505" />
        
        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/assets/images/icons/favicon.ico" />
        
        {/* Scripts */}
        <script src="/assets/js/resumeViewer.js"></script>
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LaTeX to SVG Converter",
            "description": "LaTeX to SVG converter tool for rendering mathematical equations, formulas, and scientific notation",
            "url": "https://cabhinav.com/latex/",
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "LaTeX to SVG Conversion",
              "Mathematical Equation Rendering",
              "Formula Visualization",
              "Scientific Notation Support",
              "High-Quality SVG Output"
            ],
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://cabhinav.com/"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "LaTeX Converter",
                  "item": "https://cabhinav.com/latex/"
                }
              ]
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-text-secondary">
            Redirecting to LaTeX converter...
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
