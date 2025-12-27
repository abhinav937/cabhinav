import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from './Layout';

const Strava: React.FC = () => {
  useEffect(() => {
    // Load stat dashboard styles
    const statCss = document.createElement('link');
    statCss.rel = 'stylesheet';
    statCss.href = '/web-components/stat-dashboard/style.css';
    document.head.appendChild(statCss);

    // Load stat dashboard script
    const statScript = document.createElement('script');
    statScript.src = '/web-components/stat-dashboard/script.js';
    statScript.defer = true;
    document.body.appendChild(statScript);

    // Load Font Awesome
    const faCss = document.createElement('link');
    faCss.rel = 'stylesheet';
    faCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(faCss);

    // Load Strava embed script
    const stravaEmbedScript = document.createElement('script');
    stravaEmbedScript.src = 'https://strava-embeds.com/embed.js';
    stravaEmbedScript.defer = true;
    document.body.appendChild(stravaEmbedScript);

    // Initialize on DOMContentLoaded
    const handleDOMContentLoaded = () => {
      // Initialize space background
      const spaceContainer = document.getElementById('space-background-container');
      if (spaceContainer && (window as any).initEnhancedSpaceBackground) {
        const config = {
          enableControls: false,
          mobileOptimizations: true,
          targetFps: 60,
          enableNebula: true,
          enableStarlinkTrains: false,
          starDensity: 0.5,
          shootingStarFreq: 0.001,
          nebulaCount: 0,
          animationSpeed: 1.2
        };
        (window as any).initEnhancedSpaceBackground(spaceContainer, config);
      }

      // Load personal bests data
      if ((window as any).loadPersonalBests) {
        (window as any).loadPersonalBests();
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
    } else {
      handleDOMContentLoaded();
    }

    // API Configuration and functions
    (window as any).STRAVA_API_BASE = 'https://ai-reply-bot.vercel.app/api/strava/personal-bests';

    // Handle OAuth callback
    const handleOAuth = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get('code');
      const authError = urlParams.get('error');

      if (authError) {
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (authCode) {
        const processedCodes = JSON.parse(localStorage.getItem('processedAuthCodes') || '[]');
        if (!processedCodes.includes(authCode)) {
          (window as any).exchangeAuthCode(authCode).then(() => {
            processedCodes.push(authCode);
            localStorage.setItem('processedAuthCodes', JSON.stringify(processedCodes.slice(-5)));
            window.history.replaceState({}, document.title, window.location.pathname);
          }).catch(() => {});
        } else {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    // Exchange authorization code for token
    (window as any).exchangeAuthCode = async (code: string) => {
      try {
        const response = await fetch((window as any).STRAVA_API_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: code })
        });

        const data = await response.json();

        if (data.success) {
          localStorage.setItem('stravaAuthorized', 'true');
          localStorage.setItem('stravaAuthTime', Date.now().toString());
          if ((window as any).loadPersonalBests) {
            (window as any).loadPersonalBests();
          }
        } else {
          throw new Error(data.message || 'Authorization failed');
        }
      } catch (error) {
        throw error;
      }
    };

    // Load personal bests data from API
    (window as any).loadPersonalBests = async () => {
      try {
        const response = await fetch((window as any).STRAVA_API_BASE);
        const data = await response.json();

        if (data.success) {
          (window as any).updatePersonalBests(data.data.personal_bests);
          (window as any).hideSetupMessage();
        } else if (data.setup_required) {
          (window as any).showSetupMessage();
        }
      } catch (error) {
        (window as any).showSetupMessage();
      }
    };

    // Update personal bests display with real data
    (window as any).updatePersonalBests = (personalBests: any) => {
      const distanceMapping = {
        '400m': '400m',
        'half_mile': 'halfmi',
        '1km': '1k',
        '1_mile': '1mi',
        '2_mile': '2mi',
        '5km': '5k',
        '10km': '10k',
        '15km': '15k',
        '10_mile': '10mi',
        '20km': '20k',
        'half_marathon': '21k',
        'marathon': '42k'
      };

      Object.entries(personalBests).forEach(([key, pb]: [string, any]) => {
        const htmlDistance = distanceMapping[key as keyof typeof distanceMapping];
        if (!htmlDistance) return;

        const card = document.querySelector(`[data-distance="${htmlDistance}"]`);
        if (!card) return;

        const timeValue = card.querySelector('.stat-value');
        const paceValue = card.querySelector('.stat-pace span');
        const dateValue = card.querySelector('.stat-date span');

        if (timeValue) {
          timeValue.textContent = pb.time_formatted;
          timeValue.setAttribute('data-target-seconds', pb.time_seconds);
        }

        if (paceValue) {
          paceValue.textContent = pb.pace_per_km;
        }

        if (dateValue) {
          const date = new Date(pb.start_date_local).toLocaleDateString();
          dateValue.textContent = date;
        }
      });

      const dashboard = document.querySelector('.stat-dashboard');
      if (dashboard) {
        dashboard.classList.remove('dashboard-hidden');
      }
    };

    // Show setup message
    (window as any).showSetupMessage = () => {
      const dashboard = document.querySelector('.stat-dashboard');
      if (dashboard) {
        dashboard.classList.add('dashboard-hidden');
      }

      const existing = document.querySelector('.setup-message');
      if (existing) existing.remove();

      const setupDiv = document.createElement('div');
      setupDiv.className = 'setup-message';
      setupDiv.style.cssText = `
        text-align: center;
        padding: 40px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        margin: 20px 0;
        border: 1px solid rgba(255, 255, 255, 0.1);
      `;

      setupDiv.innerHTML = `
        <h3 style="color: #fff; margin-bottom: 16px; font-size: 1.5em;">🚀 Setup Required</h3>
        <p style="color: #ccc; margin-bottom: 24px; font-size: 1.1em;">
          Connect your Strava account to view your personal bests
        </p>
        <a href="https://www.strava.com/oauth/authorize?client_id=143887&response_type=code&redirect_uri=https://cabhinav.com/strava/&approval_prompt=force&scope=read,activity:read"
           style="display: inline-block; background: #FC4C02; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; transition: background 0.3s;"
           onmouseover="this.style.background='#E04302'"
           onmouseout="this.style.background='#FC4C02'">
          🔗 Connect Strava
        </a>
      `;

      const container = document.querySelector('.strava-pb-section');
      if (container) {
        container.appendChild(setupDiv);
      }
    };

    // Hide setup message
    (window as any).hideSetupMessage = () => {
      const setupMsg = document.querySelector('.setup-message');
      if (setupMsg) {
        setupMsg.remove();
      }
    };

    // Handle OAuth on load
    handleOAuth();

    // Suppress Strava embed errors
    const originalError = window.onerror;
    window.onerror = function(msg, url, line, col, error) {
      const isStravaError = msg && (
        msg.includes('strava') ||
        msg.includes('Failed to read a named property') ||
        msg.includes('Cannot set properties of undefined') ||
        msg.includes('Cannot read properties of undefined') ||
        msg.includes('Unexpected identifier') ||
        msg.includes('windowOnloadTriggered') ||
        msg.includes('loadCDNiFrame') ||
        url && (url.includes('strava') || url.includes('uc.js'))
      );

      if (isStravaError) {
        return true;
      }

      if (originalError) {
        return originalError.call(this, msg, url, line, col, error);
      }
      return false;
    };

    return () => {
      document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded);
    };
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>Strava Activities | Abhinav Chinnusamy</title>

        {/* SEO Meta Tags */}
        <meta name="description" content="Explore Abhinav Chinnusamy's Strava running activities and performance metrics." />
        <meta name="keywords" content="Abhinav Chinnusamy, Strava, Running, Fitness, Activity Summary" />
        <meta name="author" content="Abhinav Chinnusamy" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

        {/* Geo-location Tags */}
        <meta name="geo.region" content="US-WI" />
        <meta name="geo.placename" content="Madison, Wisconsin" />
        <meta name="geo.position" content="43.0731;-89.4012" />
        <meta name="ICBM" content="43.0731, -89.4012" />

        {/* Language Targeting */}
        <link rel="alternate" hreflang="en-US" href="https://cabhinav.com/strava/" />
        <link rel="alternate" hreflang="x-default" href="https://cabhinav.com/strava/" />

        {/* Social Media Meta Tags */}
        <meta property="og:title" content="Strava Activities - Abhinav Chinnusamy" />
        <meta property="og:description" content="Explore my running journey with activity summaries, latest rides, and upcoming races" />
        <meta property="og:image" content="https://cabhinav.com/assets/images/social/strava-twitter-card.jpg" />
        <meta property="og:url" content="https://cabhinav.com/strava" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Strava Activities - Abhinav Chinnusamy" />
        <meta name="twitter:description" content="Running activities, performance metrics, and race tracking" />
        <meta name="twitter:image" content="https://cabhinav.com/assets/images/social/strava-twitter-card.jpg" />
        <meta name="twitter:creator" content="@emotor" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://cabhinav.com/strava/" />

        {/* Theme Color */}
        <meta name="theme-color" content="#161618" />

        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/assets/images/icons/favicon.ico" />

        {/* Favicon */}
        <link rel="icon" href="/assets/images/icons/favicon.ico" type="image/x-icon" />
        <link rel="shortcut" icon href="/assets/images/icons/favicon.ico" type="image/x-icon" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />

        {/* Breadcrumb Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
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
                "name": "Strava Activities",
                "item": "https://cabhinav.com/strava/"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="strava-page">
        {/* Space Background Canvas */}
        <div id="space-background-container"></div>

        <div className="strava-container">
          {/* Header Section */}
          <header className="strava-hero">
            <h1 className="strava-title">Strava Activities</h1>
            <p className="strava-subtitle">Track my running journey and performance metrics</p>
          </header>

          {/* Main Content Grid - All Three Sections */}
          <div className="strava-main-grid">
            {/* Personal Bests Dashboard */}
            <section className="strava-pb-section" aria-label="Personal Best Times">
              {/* Sortable Stat Dashboard */}
              <div className="stat-dashboard sortable-dashboard dashboard-hidden">
                <div className="dashboard-header">
                  <div className="stat-icon">
                    <span className="material-symbols-outlined">emoji_events</span>
                  </div>
                  <h2>Personal Best Times</h2>
                  <div className="sort-controls">
                    <button className="sort-btn" data-sort="distance" data-order="asc" title="Sort by Distance">
                      <span className="sort-label">Distance</span>
                      <span className="material-symbols-outlined sort-icon">unfold_more</span>
                    </button>
                    <button className="sort-btn" data-sort="pace" data-order="asc" title="Sort by Pace">
                      <span className="sort-label">Pace</span>
                      <span className="material-symbols-outlined sort-icon">unfold_more</span>
                    </button>
                  </div>
                </div>

                <div className="stats-list" id="sortable-stats-list">
                  {/* 400m */}
                  <div className="stat-card" data-type="pb" data-distance="400m">
                    <div className="stat-row">
                      <div className="stat-icon"><span className="material-symbols-outlined">emoji_events</span></div>
                      <div className="stat-label">400m</div>
                      <div className="stat-main-info">
                        <div className="stat-value" data-format="time">--:--</div>
                        <div className="stat-pace">Pace: <span>--:--</span>/km</div>
                      </div>
                      <div className="stat-date">Achieved: <span>Loading...</span></div>
                    </div>
                  </div>
                  {/* Half Mile */}
                  <div className="stat-card" data-type="pb" data-distance="halfmi">
                    <div className="stat-row">
                      <div className="stat-icon"><span className="material-symbols-outlined">emoji_events</span></div>
                      <div className="stat-label">Half Mile</div>
                      <div className="stat-main-info">
                        <div className="stat-value" data-format="time">--:--</div>
                        <div className="stat-pace">Pace: <span>--:--</span>/mi</div>
                      </div>
                      <div className="stat-date">Achieved: <span>Loading...</span></div>
                    </div>
                  </div>
                  {/* 1K */}
                  <div className="stat-card" data-type="pb" data-distance="1k">
                    <div className="stat-row">
                      <div className="stat-icon"><span className="material-symbols-outlined">emoji_events</span></div>
                      <div className="stat-label">1K</div>
                      <div className="stat-main-info">
                        <div className="stat-value" data-format="time">--:--</div>
                        <div className="stat-pace">Pace: <span>--:--</span>/km</div>
                      </div>
                      <div className="stat-date">Achieved: <span>Loading...</span></div>
                    </div>
                  </div>
                  {/* 1 Mile */}
                  <div className="stat-card" data-type="pb" data-distance="1mi">
                    <div className="stat-row">
                      <div className="stat-icon"><span className="material-symbols-outlined">emoji_events</span></div>
                      <div className="stat-label">1 Mile</div>
                      <div className="stat-main-info">
                        <div className="stat-value" data-format="time">--:--</div>
                        <div className="stat-pace">Pace: <span>--:--</span>/mi</div>
                      </div>
                      <div className="stat-date">Achieved: <span>Loading...</span></div>
                    </div>
                  </div>
                  {/* 2 Mile */}
                  <div className="stat-card" data-type="pb" data-distance="2mi">
                    <div className="stat-row">
                      <div className="stat-icon"><span className="material-symbols-outlined">emoji_events</span></div>
                      <div className="stat-label">2 Mile</div>
                      <div className="stat-main-info">
                        <div className="stat-value" data-format="time">--:--</div>
                        <div className="stat-pace">Pace: <span>--:--</span>/mi</div>
                      </div>
                      <div className="stat-date">Achieved: <span>Loading...</span></div>
                    </div>
                  </div>
                  {/* 5K */}
                  <div className="stat-card highlight" data-type="pb" data-distance="5k">
                    <div className="stat-row">
                      <div className="stat-icon"><span className="material-symbols-outlined">emoji_events</span></div>
                      <div className="stat-label">5K</div>
                      <div className="stat-main-info">
                        <div className="stat-value" data-format="time">--:--</div>
                        <div className="stat-pace">Pace: <span>--:--</span>/km</div>
                      </div>
                      <div className="stat-date">Achieved: <span>Loading...</span></div>
                    </div>
                  </div>
                  {/* 10K */}
                  <div className="stat-card" data-type="pb" data-distance="10k">
                    <div className="stat-row">
                      <div className="stat-icon"><span className="material-symbols-outlined">emoji_events</span></div>
                      <div className="stat-label">10K</div>
                      <div className="stat-main-info">
                        <div className="stat-value" data-format="time">--:--</div>
                        <div className="stat-pace">Pace: <span>--:--</span>/km</div>
                      </div>
                      <div className="stat-date">Achieved: <span>Loading...</span></div>
                    </div>
                  </div>
                  {/* 15K */}
                  <div className="stat-card" data-type="pb" data-distance="15k">
                    <div className="stat-row">
                      <div className="stat-icon"><span className="material-symbols-outlined">emoji_events</span></div>
                      <div className="stat-label">15K</div>
                      <div className="stat-main-info">
                        <div className="stat-value" data-format="time">--:--</div>
                        <div className="stat-pace">Pace: <span>--:--</span>/km</div>
                      </div>
                      <div className="stat-date">Achieved: <span>Loading...</span></div>
                    </div>
                  </div>
                  {/* 10 Mile */}
                  <div className="stat-card" data-type="pb" data-distance="10mi">
                    <div className="stat-row">
                      <div className="stat-icon"><span className="material-symbols-outlined">emoji_events</span></div>
                      <div className="stat-label">10 Mile</div>
                      <div className="stat-main-info">
                        <div className="stat-value" data-format="time">--:--</div>
                        <div className="stat-pace">Pace: <span>--:--</span>/mi</div>
                      </div>
                      <div className="stat-date">Achieved: <span>Loading...</span></div>
                    </div>
                  </div>
                  {/* 20K */}
                  <div className="stat-card" data-type="pb" data-distance="20k">
                    <div className="stat-row">
                      <div className="stat-icon"><span className="material-symbols-outlined">emoji_events</span></div>
                      <div className="stat-label">20K</div>
                      <div className="stat-main-info">
                        <div className="stat-value" data-format="time">--:--</div>
                        <div className="stat-pace">Pace: <span>--:--</span>/km</div>
                      </div>
                      <div className="stat-date">Achieved: <span>Loading...</span></div>
                    </div>
                  </div>
                  {/* Half Marathon */}
                  <div className="stat-card highlight" data-type="pb" data-distance="21k">
                    <div className="stat-row">
                      <div className="stat-icon"><span className="material-symbols-outlined">emoji_events</span></div>
                      <div className="stat-label">Half Marathon</div>
                      <div className="stat-main-info">
                        <div className="stat-value" data-format="time">--:--</div>
                        <div className="stat-pace">Pace: <span>--:--</span>/km</div>
                      </div>
                      <div className="stat-date">Achieved: <span>Loading...</span></div>
                    </div>
                  </div>
                  {/* Marathon */}
                  <div className="stat-card" data-type="pb" data-distance="42k">
                    <div className="stat-row">
                      <div className="stat-icon"><span className="material-symbols-outlined">emoji_events</span></div>
                      <div className="stat-label">Marathon</div>
                      <div className="stat-main-info">
                        <div className="stat-value" data-format="time">--:--</div>
                        <div className="stat-pace">Pace: <span>--:--</span>/km</div>
                      </div>
                      <div className="stat-date">Achieved: <span>Loading...</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Widgets Section */}
            <section className="strava-widgets" aria-label="Strava Activity Widgets">
              {/* Latest Activities */}
              <div className="strava-widget">
                <h2 className="strava-section-title">
                  <span className="material-symbols-outlined">route</span>
                  Latest Activities
                </h2>
                <div className="strava-widget-content">
                  <iframe
                    className="strava-iframe latest-rides"
                    height="300"
                    width="300"
                    style={{ border: 'none' }}
                    allowFullScreen
                    loading="lazy"
                    title="Latest Strava Activities"
                    src="https://www.strava.com/athletes/99464226/latest-rides/63bde6a12ff1a11fb4436df5e6a8aac6b8ebb32c"
                    aria-label="Latest Strava running activities">
                  </iframe>
                </div>
              </div>

              {/* My Half Marathon */}
              <div className="strava-widget">
                <h2 className="strava-section-title">
                  <span className="material-symbols-outlined">emoji_events</span>
                  My Half Marathon
                </h2>
                <div className="strava-widget-content">
                  <div className="strava-embed-placeholder" data-embed-type="activity" data-embed-id="16406693132" data-style="standard" data-from-embed="false"></div>
                </div>
              </div>
            </section>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Strava;

