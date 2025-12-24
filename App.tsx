import React, { Suspense, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Canvas } from '@react-three/fiber';
import { Experience } from './components/Experience';

interface LightSettings {
  ambientIntensity: number;
  keyIntensity: number;
  fillIntensity: number;
  rimIntensity: number;
  accent1Intensity: number;
  accent2Intensity: number;
  topIntensity: number;
  mouseIntensity: number;
  envMapIntensity: number;
  platformReflectivity: number;
  keyColor: string;
  fillColor: string;
  rimColor: string;
  accent1Color: string;
  accent2Color: string;
}

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [lightSettings] = useState<LightSettings>({
    ambientIntensity: 0.6,
    keyIntensity: 5,
    fillIntensity: 2,
    rimIntensity: 5,
    accent1Intensity: 4,
    accent2Intensity: 4,
    topIntensity: 5.5,
    mouseIntensity: 8,
    envMapIntensity: 5,
    platformReflectivity: 1.2,
    keyColor: '#ffffff',
    fillColor: '#b8d4ff',
    rimColor: '#4a9eff',
    accent1Color: '#ffb84d',
    accent2Color: '#6b9fff',
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@id": "#main-author",
      "@type": "Person",
      "name": "Abhinav Chinnusamy",
      "alternateName": "Abhinav",
      "image": "https://cabhinav.com/assets/images/profile/my_profile.jpg",
      "url": "https://cabhinav.com",
      "description": "Graduate student researcher in Power Electronics and Pulsed Power applications at UW-Madison. Specializing in GaN inverters, solid-state circuit breakers, Marx generators, and embedded systems. Former Hardware Engineering Intern at Annapurna Labs (Amazon).",
      "jobTitle": "Graduate Student Researcher",
      "worksFor": [
        {
          "@type": "Organization",
          "name": "WEMPEC",
          "url": "https://wempec.wisc.edu",
          "description": "Wisconsin Electric Machines and Power Electronics Consortium"
        },
        {
          "@type": "Organization",
          "name": "University of Wisconsin-Madison",
          "url": "https://www.wisc.edu"
        }
      ],
      "alumniOf": {
        "@type": "Organization",
        "name": "Indian Institute of Technology Dharwad",
        "url": "https://www.iitdh.ac.in"
      },
      "knowsAbout": [
        "Power Electronics",
        "Pulsed Power",
        "Marx Generators",
        "GaN Devices",
        "SiC Devices",
        "PCB Design",
        "Control Systems",
        "Hardware Design",
        "Embedded Systems",
        "Solid-State Circuit Breakers",
        "Inverters",
        "Power Systems"
      ],
      "knowsLanguage": [
        {
          "@type": "Language",
          "name": "English",
          "alternateName": "en"
        }
      ],
      "sameAs": [
        "https://github.com/abhinav937",
        "https://x.com/emotor",
        "https://scholar.google.com/citations?user=40h4Uo8AAAAJ&hl=en",
        "https://www.strava.com/athletes/99464226"
      ],
      "homeLocation": {
        "@type": "Place",
        "name": "Madison, Wisconsin",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Madison",
          "addressRegion": "WI",
          "addressCountry": "US"
        }
      },
      "hasOccupation": {
        "@type": "Occupation",
        "name": "Graduate Student Researcher",
        "occupationLocation": {
          "@type": "Place",
          "name": "University of Wisconsin-Madison",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Madison",
            "addressRegion": "WI",
            "addressCountry": "US"
          }
        },
        "skills": [
          "Power Electronics",
          "GaN Device Characterization",
          "PCB Design",
          "Control Systems",
          "Hardware Design",
          "Embedded Systems"
        ]
      },
      "hasCredential": [
        {
          "@type": "EducationalOccupationalCredential",
          "credentialCategory": "degree",
          "educationalLevel": "Master's Degree",
          "recognizedBy": {
            "@type": "Organization",
            "name": "University of Wisconsin-Madison"
          },
          "about": {
            "@type": "Thing",
            "name": "Electrical and Computer Engineering"
          }
        },
        {
          "@type": "EducationalOccupationalCredential",
          "credentialCategory": "degree",
          "educationalLevel": "Bachelor's Degree",
          "recognizedBy": {
            "@type": "Organization",
            "name": "Indian Institute of Technology Dharwad"
          },
          "about": {
            "@type": "Thing",
            "name": "Electrical Engineering"
          }
        },
        {
          "@type": "EducationalOccupationalCredential",
          "credentialCategory": "Resume",
          "recognizedBy": {
            "@type": "Organization",
            "name": "University of Wisconsin-Madison"
          },
          "url": "https://cabhinav.com/assets/documents/abhinav-chinnusamy-resume.pdf"
        }
      ],
      "additionalName": "Chinnusamy"
    },
    "url": "https://cabhinav.com",
    "name": "Abhinav Chinnusamy - Power Electronics Researcher",
    "description": "Personal website of Abhinav Chinnusamy, a graduate student researcher in power electronics at UW-Madison. Features projects and research in GaN devices, PCB design, and power systems. Completed internship at Annapurna Labs.",
    "dateModified": "2025-12-24T20:00:00Z"
  };

  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <html lang="en" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* SEO Meta Tags */}
        <meta name="keywords" content="Abhinav Chinnusamy, Power Electronics, Pulsed Power, Marx Generators, SSMGs, WEMPEC, UW Madison, Wisconsin, Madison, IIT Dharwad, ECE, Electrical Engineering, EE, Resume, CV, website" />
        <meta name="description" content="Abhinav Chinnusamy - Master's Student at UW-Madison specializing in Power Electronics and Pulsed Power applications. Graduate researcher at WEMPEC with expertise in GaN inverters, solid-state circuit breakers, and embedded systems. Completed internship at Annapurna Labs." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="author" content="Abhinav Chinnusamy" />

        {/* Geo-location Tags */}
        <meta name="geo.region" content="US-WI" />
        <meta name="geo.placename" content="Madison, Wisconsin" />
        <meta name="geo.position" content="43.0731;-89.4012" />
        <meta name="ICBM" content="43.0731, -89.4012" />

        {/* Language Targeting */}
        <link rel="alternate" hreflang="en-US" href="https://cabhinav.com/" />
        <link rel="alternate" hreflang="x-default" href="https://cabhinav.com/" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Abhinav Chinnusamy" />
        <meta property="og:url" content="https://cabhinav.com" />
        <meta property="og:image" content="https://cabhinav.com/assets/images/profile/my_profile.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Profile picture of Abhinav Chinnusamy" />
        <meta property="og:description" content="Abhinav Chinnusamy - Master's Student at UW-Madison specializing in Power Electronics and Pulsed Power applications. Graduate researcher at WEMPEC with expertise in GaN inverters, solid-state circuit breakers, and embedded systems. Completed internship at Annapurna Labs." />
        <meta property="og:site_name" content="cabhinav.com" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://cabhinav.com/assets/images/profile/my_profile.jpg" />
        <meta name="twitter:creator" content="@emotor" />
        <meta name="twitter:site" content="@emotor" />
        <meta name="twitter:title" content="Abhinav Chinnusamy" />
        <meta name="twitter:description" content="Abhinav Chinnusamy - Master's Student at UW-Madison specializing in Power Electronics and Pulsed Power applications. Graduate researcher at WEMPEC with expertise in GaN inverters, solid-state circuit breakers, and embedded systems. Completed internship at Annapurna Labs." />

        {/* Canonical URL */}
        <link rel="canonical" href="https://cabhinav.com/" />

        {/* Theme Color */}
        <meta name="theme-color" content="#050505" />

        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="./assets/images/icons/favicon.ico" />

        {/* Favicon */}
        <link rel="shortcut icon" href="./assets/images/icons/favicon.ico" type="image/x-icon" />
        <link rel="icon" type="image/x-icon" href="./assets/images/icons/favicon.ico" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

        {/* Icons */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />

        {/* Styles */}
        <link rel="stylesheet" href="./assets/css/grok-style.css" />
        <link rel="stylesheet" href="./assets/css/space-background.css" />

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-FDSLDZ5EWW"></script>
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', 'G-FDSLDZ5EWW');
          `}
        </script>

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="relative w-full h-screen bg-[#050505]">
        {/* 3D Scene */}
        <Canvas
          shadows
          camera={{ 
            position: [0, 0, 15], 
            fov: isMobile ? 50 : 35 
          }}
          gl={{ 
            antialias: true, 
            alpha: true,
            toneMapping: 3 // ACESFilmicToneMapping
          }}
          dpr={[1, 2]} // Limit pixel ratio for better performance on mobile
        >
          <Suspense fallback={null}>
            <Experience lightSettings={lightSettings} />
          </Suspense>
        </Canvas>

        {/* Footer */}
        <footer className="footer absolute bottom-0 left-0 right-0 z-20">
          <div className="container">
            <div className="footer-content">
              <div className="footer-links">
                <a href="https://x.com/emotor" target="_blank" className="footer-link" rel="noopener noreferrer">
                  <img src="./assets/images/social/x-svg.svg" alt="X (Twitter)" className="footer-icon-svg" />
                </a>
                <a href="https://github.com/abhinav937" target="_blank" className="footer-link" rel="noopener noreferrer">
                  <span className="material-symbols-outlined">code</span>
                </a>
                <a href="https://scholar.google.com/citations?user=40h4Uo8AAAAJ&hl=en" target="_blank" className="footer-link" rel="noopener noreferrer">
                  <span className="material-symbols-outlined">school</span>
                </a>
                <a href="https://www.strava.com/athletes/99464226" target="_blank" className="footer-link" rel="noopener noreferrer">
                  <span className="material-symbols-outlined">directions_run</span>
                </a>
              </div>

              <p className="footer-text">© 2025 Abhinav Chinnusamy. Power Electronics Engineer.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default App;
