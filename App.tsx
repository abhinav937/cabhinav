import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Experience } from './components/Experience';

// Page Components
import Projects from './components/Projects';
import Publications from './components/Publications';
import Strava from './components/Strava';
import CLI from './components/CLI';
import Latex from './components/Latex';
import Space from './components/Space';
import Chat from './components/Chat';
import ThreeD from './components/ThreeD';
import XPage from './components/XPage';
import LS from './components/LS';

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

// Enhanced lighting configuration for maximum brightness
const LIGHT_SETTINGS: LightSettings = {
  ambientIntensity: 2.0,
  keyIntensity: 15,
  fillIntensity: 8,
  rimIntensity: 12,
  accent1Intensity: 10,
  accent2Intensity: 10,
  topIntensity: 16,
  mouseIntensity: 20,
  envMapIntensity: 15,
  platformReflectivity: 2.5,
  keyColor: '#ffffff',
  fillColor: '#b8d4ff',
  rimColor: '#4a9eff',
  accent1Color: '#ffb84d',
  accent2Color: '#6b9fff',
};

// Structured data for SEO
const STRUCTURED_DATA = {
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
} as const;

const App = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Responsive detection with debouncing
  const checkDeviceType = useCallback(() => {
    const width = window.innerWidth;
    setIsMobile(width < 768);
    setIsTablet(width >= 768 && width <= 1024);
  }, []);

  useEffect(() => {
    checkDeviceType();
    
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkDeviceType, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [checkDeviceType]);

  // Canvas initialization handler
  const handleCanvasCreated = useCallback(({ gl, camera }: { gl: THREE.WebGLRenderer; camera: THREE.Camera }) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const devicePixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

    gl.setSize(width, height);
    gl.setPixelRatio(devicePixelRatio);
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }, [isMobile]);

  return (
    <Router>
      <Routes>
        {/* Homepage with 3D Scene */}
        <Route path="/" element={
          <>
            <Helmet>
              {/* Basic Meta Tags */}
              <html lang="en" />
              <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />

              {/* Critical CSS for preventing layout shift */}
              <style>{`
                * {
                  box-sizing: border-box;
                }
                html, body {
                  margin: 0;
                  padding: 0;
                  overflow: hidden;
                  height: 100vh;
                  width: 100vw;
                  position: fixed;
                  top: 0;
                  left: 0;
                  background: #050505;
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                }
                #root {
                  width: 100vw;
                  height: 100vh;
                  overflow: hidden;
                  position: fixed;
                  top: 0;
                  left: 0;
                  margin: 0;
                  padding: 0;
                }
                @media (max-width: 768px) {
                  html, body {
                    touch-action: none;
                    -webkit-overflow-scrolling: none;
                    -webkit-tap-highlight-color: transparent;
                  }
                }
              `}</style>

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
              <link rel="alternate" hrefLang="en-US" href="https://cabhinav.com/" />
              <link rel="alternate" hrefLang="x-default" href="https://cabhinav.com/" />

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

              {/* Icons */}
              <link rel="apple-touch-icon" href="/assets/images/icons/favicon.ico" />
              <link rel="shortcut icon" href="/assets/images/icons/favicon.ico" type="image/x-icon" />
              <link rel="icon" type="image/x-icon" href="/assets/images/icons/favicon.ico" />

              {/* Fonts */}
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

              {/* Material Icons */}
              <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />

              {/* External Stylesheets */}
              <link rel="stylesheet" href="/assets/css/style.css" />
              <link rel="stylesheet" href="/assets/css/grok-style.css" />
              <link rel="stylesheet" href="/assets/css/space-background.css" />
              <link rel="stylesheet" href="/assets/css/lazy-loading.css" />

              {/* Utility Scripts */}
              <script src="/assets/js/bootstrap.js"></script>
              <script src="/assets/js/script.js"></script>
              <script src="/assets/js/optimizations.js"></script>

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
                {JSON.stringify(STRUCTURED_DATA)}
              </script>
            </Helmet>

            <div
              className="app-container"
              style={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                backgroundColor: '#050505'
              }}
            >
              {/* 3D Canvas Scene */}
              <Canvas
                shadows
                camera={{
                  position: [0, 0, 15],
                  fov: 35,
                  near: 0.1,
                  far: 100
                }}
                gl={{
                  antialias: true,
                  alpha: true,
                  toneMapping: THREE.ACESFilmicToneMapping,
                  toneMappingExposure: 2.5,
                  powerPreference: "high-performance",
                  preserveDrawingBuffer: false,
                  stencil: false,
                  depth: true
                }}
                dpr={[1, 2]}
                frameloop="always"
                performance={{ min: 0.5 }}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  margin: 0,
                  padding: 0,
                  touchAction: 'none'
                }}
                onCreated={handleCanvasCreated}
              >
                <Suspense fallback={null}>
                  <Experience
                    lightSettings={LIGHT_SETTINGS}
                    isMobile={isMobile}
                    isTablet={isTablet}
                  />
                </Suspense>
              </Canvas>

              {/* Footer Navigation */}
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
                        <img
                          src="/assets/images/social/x-svg.svg"
                          alt="X (Twitter)"
                          className="footer-icon-svg"
                          loading="lazy"
                          width="18"
                          height="18"
                        />
                      </a>
                      <a
                        href="https://github.com/abhinav937"
                        target="_blank"
                        className="footer-link"
                        rel="noopener noreferrer"
                        aria-label="GitHub Profile"
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">code</span>
                      </a>
                      <a
                        href="https://scholar.google.com/citations?user=40h4Uo8AAAAJ&hl=en"
                        target="_blank"
                        className="footer-link"
                        rel="noopener noreferrer"
                        aria-label="Google Scholar Profile"
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">school</span>
                      </a>
                      <a
                        href="https://www.strava.com/athletes/99464226"
                        target="_blank"
                        className="footer-link"
                        rel="noopener noreferrer"
                        aria-label="Strava Profile"
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">directions_run</span>
                      </a>
                    </div>
                    <p className="footer-text">
                      © 2025 Abhinav Chinnusamy. Power Electronics Engineer.
                    </p>
                  </div>
                </div>
              </footer>
            </div>
          </>
        } />

        {/* Other Pages */}
        <Route path="/projects" element={<Projects />} />
        <Route path="/publications" element={<Publications />} />
        <Route path="/strava" element={<Strava />} />
        <Route path="/cli" element={<CLI />} />
        <Route path="/latex" element={<Latex />} />
        <Route path="/space" element={<Space />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/3d" element={<ThreeD />} />
        <Route path="/x" element={<XPage />} />
        <Route path="/ls" element={<LS />} />
      </Routes>
    </Router>
  );
};

export default App;
