// Projects data
const PROJECTS = [
  {
    id: 'yeswegan',
    title: 'YesWeGaN',
    description: '3-Phase GaN Inverter',
    image: '../assets/images/projects/yeswegan1.JPEG',
    alt: 'YesWeGaN 3-Phase GaN Inverter',
    techStack: ['GaN', 'FPGA', 'Power'],
  },
  {
    id: 'gan-half-bridge',
    title: 'GaN Half-Bridge Inverter',
    description: 'High-frequency GaN half-bridge inverter',
    image: '../assets/images/projects/gan.webp',
    alt: 'GaN Half Bridge inverter',
    techStack: ['GaN', 'Half-Bridge', 'High-Freq'],
  },
  {
    id: 'sic-sscb',
    title: 'SiC Solid State Circuit Breaker',
    description: 'Modular SiC-based solid state circuit breaker',
    image: '../assets/images/projects/modular-sscb.webp',
    alt: 'SiC Solid State Circuit Breaker',
    techStack: ['SiC', 'SSCB', 'Modular'],
  },
  {
    id: 'rp2040-dev-board',
    title: 'RP2040 Development Board',
    description: 'Custom RP2040 development board',
    image: '../assets/images/projects/rp2.webp',
    alt: 'RP2040 Development Board',
    techStack: ['RP2040', 'PCB', 'MicroPython'],
  },
  {
    id: 'high-bw-sensor',
    title: 'High Bandwidth Current Sensor',
    description: 'Precision high-bandwidth current sensor',
    image: '../assets/images/projects/opav2.webp',
    alt: 'High Bandwidth Current Sensor',
    techStack: ['OPA855', 'High-BW', 'Precision'],
  },
  {
    id: 'sos-smart-band',
    title: 'RP2040 SOS Smart Band',
    description: 'IoT wearable with SOS functionality',
    image: '../assets/images/projects/sos_1.webp',
    alt: 'RP2040 SOS Smart Band',
    techStack: ['RP2040', 'IoT', 'Wearable'],
  },
];

// Structured data for SEO
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Projects - Abhinav Chinnusamy",
  "description": "Featured projects by Abhinav Chinnusamy - Power Electronics Engineer showcasing work in GaN inverters, SiC circuit breakers, embedded systems, and PCB design.",
  "url": "https://cabhinav.com/projects/",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": PROJECTS.map((project, index) => ({
      "@type": "CreativeWork",
      "position": index + 1,
      "name": project.title,
      "description": project.description,
      "image": `https://cabhinav.com/${project.image.replace('../', '')}`,
      "url": `https://cabhinav.com/projects/#${project.id}`,
    })),
  },
  "author": {
    "@type": "Person",
    "name": "Abhinav Chinnusamy",
    "url": "https://cabhinav.com",
  },
};

// Breadcrumb structured data
const BREADCRUMB_DATA = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://cabhinav.com/",
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Projects",
      "item": "https://cabhinav.com/projects/",
    },
  ],
};

// React component using JSX transform
const Projects = () => {
  // Set document title
  React.useEffect(() => {
    document.title = 'Projects - Abhinav Chinnusamy';

    // Add meta tags
    const metaTags = [
      { name: 'description', content: 'Featured projects by Abhinav Chinnusamy - Power Electronics Engineer showcasing work in GaN inverters, SiC circuit breakers, embedded systems, and PCB design.' },
      { name: 'keywords', content: 'Abhinav Chinnusamy, Power Electronics, Projects, GaN, SiC, RP2040, PCB Design, Embedded Systems' },
      { name: 'author', content: 'Abhinav Chinnusamy' },
      { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
      { name: 'geo.region', content: 'US-WI' },
      { name: 'geo.placename', content: 'Madison, Wisconsin' },
      { name: 'geo.position', content: '43.0731;-89.4012' },
      { name: 'ICBM', content: '43.0731, -89.4012' },
      { name: 'theme-color', content: '#161618' },
      // Open Graph
      { property: 'og:title', content: 'Projects - Abhinav Chinnusamy' },
      { property: 'og:url', content: 'https://cabhinav.com/projects/' },
      { property: 'og:image', content: 'https://cabhinav.com/assets/images/projects/yeswegan1.JPEG' },
      { property: 'og:image:alt', content: 'YesWeGaN 3-Phase GaN Inverter Project' },
      { property: 'og:description', content: 'Featured projects by Abhinav Chinnusamy - Power Electronics Engineer showcasing work in GaN inverters, SiC circuit breakers, embedded systems, and PCB design.' },
      { property: 'og:type', content: 'website' },
      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Projects - Abhinav Chinnusamy' },
      { name: 'twitter:description', content: 'Featured projects by Abhinav Chinnusamy - Power Electronics Engineer showcasing work in GaN inverters, SiC circuit breakers, embedded systems, and PCB design.' },
      { name: 'twitter:image', content: 'https://cabhinav.com/assets/images/projects/yeswegan1.JPEG' },
      { name: 'twitter:creator', content: '@emotor' },
    ];

    // Add meta tags to head
    metaTags.forEach(tag => {
      const meta = document.createElement('meta');
      Object.keys(tag).forEach(key => {
        meta.setAttribute(key, tag[key]);
      });
      document.head.appendChild(meta);
    });

    // Add link tags
    const linkTags = [
      { rel: 'canonical', href: 'https://cabhinav.com/projects/' },
      { rel: 'alternate', hreflang: 'en-US', href: 'https://cabhinav.com/projects/' },
      { rel: 'alternate', hreflang: 'x-default', href: 'https://cabhinav.com/projects/' },
    ];

    linkTags.forEach(tag => {
      const link = document.createElement('link');
      Object.keys(tag).forEach(key => {
        link.setAttribute(key, tag[key]);
      });
      document.head.appendChild(link);
    });

    // Add structured data
    const structuredScript = document.createElement('script');
    structuredScript.type = 'application/ld+json';
    structuredScript.textContent = JSON.stringify(STRUCTURED_DATA);
    document.head.appendChild(structuredScript);

    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.textContent = JSON.stringify(BREADCRUMB_DATA);
    document.head.appendChild(breadcrumbScript);

  }, []);

  return React.createElement('div', {
    className: 'app-container',
    style: { backgroundColor: '#161618', minHeight: '100vh' }
  }, [
    React.createElement('main', { key: 'main' }, [
      React.createElement('section', { className: 'section', id: 'projects', key: 'projects-section' }, [
        React.createElement('div', { className: 'container', key: 'container' }, [
          React.createElement('div', { className: 'section-header', key: 'header' }, [
            React.createElement('h2', { key: 'title' }, 'Featured Projects'),
            React.createElement('p', { className: 'text-muted', key: 'subtitle' }, 'A showcase of my work in power electronics, embedded systems, and analog design')
          ]),
          React.createElement('div', { className: 'projects-grid', key: 'grid' },
            PROJECTS.map((project, index) =>
              React.createElement('div', {
                className: 'project-card fade-in-up',
                key: project.id,
                style: { animationDelay: `${index * 0.1}s` }
              }, [
                React.createElement('div', { className: 'project-image-container', key: 'image-container' }, [
                  React.createElement('img', {
                    src: project.image,
                    alt: project.alt,
                    className: 'project-image',
                    loading: 'lazy',
                    key: 'image'
                  }),
                  React.createElement('div', { className: 'project-overlay', key: 'overlay' }, [
                    React.createElement('div', { className: 'project-tech-stack', key: 'tech-stack' },
                      project.techStack.map(tech =>
                        React.createElement('span', { className: 'tech-tag', key: tech }, tech)
                      )
                    )
                  ])
                ]),
                React.createElement('div', { className: 'project-info', key: 'info' }, [
                  React.createElement('h3', { className: 'project-title', key: 'title' }, project.title)
                ])
              ])
            )
          )
        ])
      ])
    ]),
    React.createElement('footer', { className: 'footer', key: 'footer' }, [
      React.createElement('div', { className: 'container', key: 'footer-container' }, [
        React.createElement('div', { className: 'footer-content', key: 'footer-content' }, [
          React.createElement('div', { className: 'footer-links', key: 'footer-links' }, [
            React.createElement('a', {
              href: 'https://x.com/emotor',
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'footer-link',
              key: 'x-link'
            }, [
              React.createElement('img', {
                src: '../assets/images/social/x-svg.svg',
                alt: 'X (Twitter)',
                className: 'footer-icon-svg',
                key: 'x-icon'
              })
            ]),
            React.createElement('a', {
              href: 'https://github.com/abhinav937',
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'footer-link',
              key: 'github-link'
            }, [
              React.createElement('span', { className: 'material-symbols-outlined', key: 'github-icon' }, 'code')
            ]),
            React.createElement('a', {
              href: 'https://scholar.google.com/citations?user=40h4Uo8AAAAJ&hl=en',
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'footer-link',
              key: 'scholar-link'
            }, [
              React.createElement('span', { className: 'material-symbols-outlined', key: 'scholar-icon' }, 'school')
            ]),
            React.createElement('a', {
              href: 'https://www.strava.com/athletes/99464226',
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'footer-link',
              key: 'strava-link'
            }, [
              React.createElement('span', { className: 'material-symbols-outlined', key: 'strava-icon' }, 'directions_run')
            ])
          ]),
          React.createElement('p', { className: 'footer-text', key: 'footer-text' }, '© 2025 Abhinav Chinnusamy. Power Electronics Engineer.')
        ])
      ])
    ])
  ]);
};

// Make Projects available globally
window.Projects = Projects;
