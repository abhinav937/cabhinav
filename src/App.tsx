import { Helmet } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Footer from './components/ui/Footer';

// Page Components
import Projects from './components/pages/Projects';
import Publications from './components/pages/Publications';
import Strava from './components/pages/Strava';
import CLI from './components/pages/CLI';
import Latex from './components/pages/Latex';
import Space from './components/pages/Space';
import Chat from './components/pages/Chat';
import XPage from './components/pages/XPage';
import LS from './components/pages/LS';

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
  return (
    <Router>
      <Routes>
        {/* Homepage with Minimalist Design */}
        <Route path="/" element={
          <>
            <Helmet>
              {/* Basic Meta Tags */}
              <html lang="en" />
              <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />

              {/* SEO Meta Tags */}
              <meta name="keywords" content="Abhinav Chinnusamy, Power Electronics, Pulsed Power, Marx Generators, SSMGs, WEMPEC, UW Madison, Wisconsin, Madison, IIT Dharwad, ECE, Electrical Engineering, EE, Resume, CV, website" />
              <meta name="description" content="Abhinav Chinnusamy - Graduate Student Researcher at UW-Madison specializing in Power Electronics and Pulsed Power applications. Expertise in GaN inverters, solid-state circuit breakers, and embedded systems." />
              <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
              <meta name="author" content="Abhinav Chinnusamy" />

              {/* Open Graph */}
              <meta property="og:type" content="website" />
              <meta property="og:title" content="Abhinav Chinnusamy - Power Electronics Researcher" />
              <meta property="og:url" content="https://cabhinav.com" />
              <meta property="og:image" content="https://cabhinav.com/assets/images/profile/my_profile.jpg" />
              <meta property="og:description" content="Graduate student researcher in Power Electronics at UW-Madison. Specializing in GaN inverters, solid-state circuit breakers, Marx generators, and embedded systems." />
              <meta property="og:site_name" content="cabhinav.com" />

              {/* Twitter */}
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content="Abhinav Chinnusamy - Power Electronics Researcher" />
              <meta name="twitter:description" content="Graduate student researcher in Power Electronics at UW-Madison. Specializing in GaN inverters, solid-state circuit breakers, Marx generators, and embedded systems." />

              {/* Theme and Icons */}
              <meta name="theme-color" content="#050505" />
              <link rel="icon" href="/assets/images/icons/favicon.ico" />

              {/* Fonts */}
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Fira+Code:wght@400&display=swap" rel="stylesheet" />

              {/* Material Icons */}
              <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />

              {/* Bootstrap Icons */}
              <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" />

              {/* Stylesheets */}
              <link rel="stylesheet" href="/assets/css/desktop-navbar.css" />
              <link rel="stylesheet" href="/assets/css/style.css" />

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
                {JSON.stringify({
                  ...STRUCTURED_DATA,
                  "mainEntity": {
                    ...STRUCTURED_DATA.mainEntity,
                    "hasOccupation": {
                      ...STRUCTURED_DATA.mainEntity.hasOccupation,
                      "occupationLocation": {
                        "@type": "Place",
                        "name": "University of Wisconsin-Madison"
                      }
                    }
                  },
                  "hasPart": [
                    {
                      "@type": "WebPage",
                      "name": "Projects",
                      "url": "https://cabhinav.com/projects/",
                      "description": "Power electronics, GaN inverters, and hardware design projects"
                    },
                    {
                      "@type": "WebPage",
                      "name": "Strava Activities",
                      "url": "https://cabhinav.com/strava/",
                      "description": "Running activities and performance metrics"
                    },
                    {
                      "@type": "WebPage",
                      "name": "CLI Terminal",
                      "url": "https://cabhinav.com/cli/",
                      "description": "Web Serial Terminal for hardware communication"
                    },
                    {
                      "@type": "WebPage",
                      "name": "LaTeX to SVG Converter",
                      "url": "https://cabhinav.com/latex/",
                      "description": "LaTeX to SVG converter tool for rendering mathematical equations and formulas"
                    }
                  ]
                })}
              </script>
            </Helmet>

            <div className="min-h-screen bg-background text-primary selection:bg-white/20 flex flex-col">
              <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-8 bg-gradient-to-br from-white via-gray-100 to-gray-300 bg-clip-text text-transparent text-center">
                  Abhinav Chinnusamy
                </h1>
                
                {/* Navigation Links for SEO */}
                <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-8" aria-label="Main navigation">
                  <a 
                    href="/projects" 
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                    aria-label="View my projects in power electronics and hardware design"
                  >
                    Projects
                  </a>
                  <a 
                    href="/strava" 
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                    aria-label="View my Strava running activities and performance metrics"
                  >
                    Strava
                  </a>
                  <a 
                    href="/cli" 
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                    aria-label="Web Serial Terminal for hardware communication and debugging"
                  >
                    CLI Terminal
                  </a>
                  <a 
                    href="/latex" 
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                    aria-label="LaTeX to SVG converter tool for mathematical equations"
                  >
                    LaTeX Converter
                  </a>
                </nav>
              </main>

              <Footer />
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
        <Route path="/x" element={<XPage />} />
        <Route path="/ls" element={<LS />} />
      </Routes>
    </Router>
  );
};

export default App;
