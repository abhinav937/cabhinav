import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '../ui/Layout';

interface PersonalBest {
  time_formatted: string;
  time_seconds: number;
  pace_per_km: string;
  start_date_local: string;
}

interface PersonalBests {
  [key: string]: PersonalBest;
}

interface DistanceConfig {
  key: string;
  label: string;
  distance: string;
  unit: 'km' | 'mi';
  highlight?: boolean;
}

const DISTANCE_CONFIGS: DistanceConfig[] = [
  { key: '400m', label: '400m', distance: '400m', unit: 'km' },
  { key: 'half_mile', label: 'Half Mile', distance: 'halfmi', unit: 'mi' },
  { key: '1km', label: '1K', distance: '1k', unit: 'km' },
  { key: '1_mile', label: '1 Mile', distance: '1mi', unit: 'mi' },
  { key: '2_mile', label: '2 Mile', distance: '2mi', unit: 'mi' },
  { key: '5km', label: '5K', distance: '5k', unit: 'km', highlight: true },
  { key: '10km', label: '10K', distance: '10k', unit: 'km' },
  { key: '15km', label: '15K', distance: '15k', unit: 'km' },
  { key: '10_mile', label: '10 Mile', distance: '10mi', unit: 'mi' },
  { key: '20km', label: '20K', distance: '20k', unit: 'km' },
  { key: 'half_marathon', label: 'Half Marathon', distance: '21k', unit: 'km', highlight: true },
  { key: 'marathon', label: 'Marathon', distance: '42k', unit: 'km' },
];

const STRAVA_API_BASE = 'https://ai-reply-bot.vercel.app/api/strava/personal-bests';
const STRAVA_CLIENT_ID = '143887';
const STRAVA_REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/strava` 
  : 'https://cabhinav.com/strava';
const STRAVA_AUTH_URL = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&approval_prompt=force&scope=read,activity:read`;

const Strava: React.FC = () => {
  const [personalBests, setPersonalBests] = useState<PersonalBests | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'pace'>('distance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize space background (from Space page)
  useEffect(() => {
    const initSpaceBackground = (target: HTMLElement, density: number, speed: number, shootingEnabled: boolean) => {
      function rand(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      // Create and style canvas
      const canvas = document.createElement('canvas');
      canvas.className = 'space-bg-canvas';
      target.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return () => {}; // Return empty cleanup if no context
      }
      const ctxNonNull = ctx;

      // Star layers - density affects total count
      const densityMultiplier = density / 200; // Normalize to default 200
      const STAR_LAYERS = [
        { count: Math.floor(1000 * densityMultiplier), speed: 0.03, size: [0.3, 0.8], color: 'white' },
        { count: Math.floor(500 * densityMultiplier), speed: 0.01, size: [0.8, 1.3], color: 'rgba(180,200,255,0.7)' },
        { count: Math.floor(200 * densityMultiplier), speed: 0.005, size: [1.3, 2], color: 'rgba(255,220,200,0.6)' }
      ];
      let stars: Array<{
        baseSize: number;
        color: string;
        twinkleSpeed: number;
        twinklePhase: number;
        layer: number;
        angle: number;
        radius: number;
      }> = [];

      function createStars() {
        stars = [];
        STAR_LAYERS.forEach((layer, i) => {
          for (let j = 0; j < layer.count; j++) {
            const angle = rand(0, Math.PI * 2);
            const radius = rand(0, Math.max(canvas.width, canvas.height) * 1.5);
            stars.push({
              baseSize: rand(layer.size[0], layer.size[1]),
              color: layer.color,
              twinkleSpeed: rand(0.001, 0.003),
              twinklePhase: rand(0, Math.PI * 2),
              layer: i,
              angle: angle,
              radius: radius
            });
          }
        });
      }

      function resize() {
        const isFixed = window.getComputedStyle(target).position === 'fixed';
        if (isFixed) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        } else {
          canvas.width = target?.clientWidth || window.innerWidth;
          canvas.height = target?.clientHeight || window.innerHeight;
        }
        createStars();
      }
      window.addEventListener('resize', resize);

      function drawBackground() {
        ctxNonNull.globalAlpha = 1;
        ctxNonNull.fillStyle = '#161618';
        ctxNonNull.fillRect(0, 0, canvas.width, canvas.height);
      }

      function drawStars(globalAngle: number) {
        const now = Date.now();
        const cx = canvas.width * 1.5;
        const cy = canvas.height * 1.5;
        stars.forEach(star => {
          const angle = star.angle + globalAngle;
          const x = cx + Math.cos(angle) * star.radius;
          const y = cy + Math.sin(angle) * star.radius;
          const twinkle = 0.7 + 0.3 * Math.sin(now * star.twinkleSpeed + star.twinklePhase);
          const size = star.baseSize * twinkle;
          if (star.baseSize > 1.5) {
            ctxNonNull.save();
            ctxNonNull.globalAlpha = 0.3 * twinkle;
            ctxNonNull.shadowBlur = 16;
            ctxNonNull.shadowColor = star.color;
            ctxNonNull.beginPath();
            ctxNonNull.arc(x, y, size * 1.7, 0, Math.PI * 2);
            ctxNonNull.fillStyle = star.color;
            ctxNonNull.fill();
            ctxNonNull.restore();
          }
          const fadeAlpha = 0.85 * twinkle;
          const fadeBlur = (star.baseSize > 2 ? 8 : 2) * fadeAlpha;
          ctxNonNull.save();
          ctxNonNull.globalAlpha = fadeAlpha;
          ctxNonNull.shadowBlur = fadeBlur;
          ctxNonNull.shadowColor = star.color;
          ctxNonNull.beginPath();
          ctxNonNull.arc(x, y, size, 0, Math.PI * 2);
          ctxNonNull.fillStyle = star.color;
          ctxNonNull.fill();
          ctxNonNull.restore();
        });
      }

      // Shooting stars
      const SHOOTING_STAR_FREQ = shootingEnabled ? 0.002 : 0;
      const SHOOTING_STAR_LIFETIME = 1200;
      let shootingStars: Array<{
        x: number;
        y: number;
        dx: number;
        dy: number;
        start: number;
        len: number;
        size: number;
        color: string;
      }> = [];

      function spawnShootingStar() {
        const margin = 40;
        const x = rand(margin, canvas.width - margin);
        const y = margin;
        const angleBase = rand(Math.PI / 12, Math.PI / 4);
        const angle = Math.PI - angleBase;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        shootingStars.push({
          x, y, dx, dy, start: Date.now(),
          len: rand(320, 480),
          size: rand(1.1, 1.7),
          color: 'rgba(255,255,255,0.98)'
        });
      }

      function drawShootingStars() {
        const now = Date.now();
        shootingStars = shootingStars.filter(star => now - star.start < SHOOTING_STAR_LIFETIME);
        shootingStars.forEach(star => {
          const age = now - star.start;
          const fade = 1 - age / SHOOTING_STAR_LIFETIME;
          star.x += star.dx * star.len / SHOOTING_STAR_LIFETIME * 16;
          star.y += star.dy * star.len / SHOOTING_STAR_LIFETIME * 16;
          let tailLen = star.len * fade;
          const tailX = star.x - star.dx * tailLen;
          const tailY = star.y - star.dy * tailLen;
          const grad = ctxNonNull.createLinearGradient(star.x, star.y, tailX, tailY);
          grad.addColorStop(0, `rgba(255,255,255,${0.8 * fade})`);
          grad.addColorStop(0.2, `rgba(255,255,255,${0.25 * fade})`);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctxNonNull.save();
          ctxNonNull.globalAlpha = 1;
          ctxNonNull.strokeStyle = grad;
          ctxNonNull.beginPath();
          ctxNonNull.moveTo(star.x, star.y);
          ctxNonNull.lineTo(tailX, tailY);
          ctxNonNull.lineWidth = star.size * (0.8 + 0.7 * fade);
          ctxNonNull.shadowBlur = 12;
          ctxNonNull.shadowColor = 'white';
          ctxNonNull.stroke();
          ctxNonNull.restore();
          ctxNonNull.save();
          ctxNonNull.globalAlpha = 0.85 * fade;
          ctxNonNull.shadowBlur = 18;
          ctxNonNull.shadowColor = 'white';
          ctxNonNull.beginPath();
          ctxNonNull.arc(star.x, star.y, star.size * 1.3, 0, Math.PI * 2);
          ctxNonNull.fillStyle = 'white';
          ctxNonNull.fill();
          ctxNonNull.restore();
        });
      }

      let globalAngle = 0;
      let animationId: number;
      const speedMultiplier = speed;

      function animate() {
        drawBackground();
        drawStars(globalAngle);
        drawShootingStars();
        globalAngle += 0.00024 * speedMultiplier;
        if (Math.random() < SHOOTING_STAR_FREQ) {
          spawnShootingStar();
        }
        animationId = requestAnimationFrame(animate);
      }

      resize();
      animate();

      return () => {
        window.removeEventListener('resize', resize);
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      };
    };

    // Make Layout background transparent
    const timer = setTimeout(() => {
      const allDivs = document.querySelectorAll('div');
      allDivs.forEach((div) => {
        const htmlDiv = div as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlDiv);
        if (
          computedStyle.minHeight === '100vh' &&
          computedStyle.backgroundColor === 'rgb(0, 0, 0)'
        ) {
          htmlDiv.style.backgroundColor = 'transparent';
        }
      });
    }, 100);

    // Initialize space background after a short delay to ensure container is mounted
    let cleanupFn: (() => void) | undefined;
    const initTimer = setTimeout(() => {
      if (containerRef.current) {
        cleanupFn = initSpaceBackground(containerRef.current, 200, 1, true);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      clearTimeout(initTimer);
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, []);

  // Load Strava embed script
  useEffect(() => {
    const stravaEmbedScript = document.createElement('script');
    stravaEmbedScript.src = 'https://strava-embeds.com/embed.js';
    stravaEmbedScript.defer = true;
    document.body.appendChild(stravaEmbedScript);

    return () => {
      if (stravaEmbedScript.parentNode) {
        stravaEmbedScript.parentNode.removeChild(stravaEmbedScript);
      }
    };
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const authError = urlParams.get('error');

    if (authError) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setSetupRequired(true);
    } else if (authCode) {
      const processedCodes = JSON.parse(localStorage.getItem('processedAuthCodes') || '[]');
      if (!processedCodes.includes(authCode)) {
        exchangeAuthCode(authCode).then(() => {
          processedCodes.push(authCode);
          localStorage.setItem('processedAuthCodes', JSON.stringify(processedCodes.slice(-5)));
          window.history.replaceState({}, document.title, window.location.pathname);
          loadPersonalBests();
        }).catch(() => {
          setSetupRequired(true);
        });
      } else {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Exchange authorization code for token
  const exchangeAuthCode = useCallback(async (code: string) => {
    try {
      const response = await fetch(STRAVA_API_BASE, {
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
      } else {
        throw new Error(data.message || 'Authorization failed');
      }
    } catch (error) {
      throw error;
    }
  }, []);

  // Load personal bests data from API
  const loadPersonalBests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(STRAVA_API_BASE);
      const data = await response.json();

      if (data.success) {
        setPersonalBests(data.data.personal_bests);
        setSetupRequired(false);
      } else if (data.setup_required) {
        setSetupRequired(true);
      }
    } catch (error) {
      setSetupRequired(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load personal bests on mount
  useEffect(() => {
    loadPersonalBests();
  }, [loadPersonalBests]);

  // Sort personal bests
  const sortedDistances = React.useMemo(() => {
    if (!personalBests) return DISTANCE_CONFIGS;

    return [...DISTANCE_CONFIGS].sort((a, b) => {
      const pbA = personalBests[a.key];
      const pbB = personalBests[b.key];

      if (!pbA || !pbB) return 0;

      if (sortBy === 'distance') {
        // Sort by distance (approximate)
        const order = ['400m', 'half_mile', '1km', '1_mile', '2_mile', '5km', '10km', '15km', '10_mile', '20km', 'half_marathon', 'marathon'];
        const indexA = order.indexOf(a.key);
        const indexB = order.indexOf(b.key);
        return sortOrder === 'asc' ? indexA - indexB : indexB - indexA;
      } else {
        // Sort by pace
        const paceA = parseFloat(pbA.pace_per_km.replace(':', '.'));
        const paceB = parseFloat(pbB.pace_per_km.replace(':', '.'));
        return sortOrder === 'asc' ? paceA - paceB : paceB - paceA;
      }
    });
  }, [personalBests, sortBy, sortOrder]);

  const handleSort = (newSortBy: 'distance' | 'pace') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Strava Activities | Abhinav Chinnusamy</title>
        <meta name="description" content="Explore Abhinav Chinnusamy's Strava running activities and performance metrics." />
        <meta name="keywords" content="Abhinav Chinnusamy, Strava, Running, Fitness, Activity Summary" />
        <meta name="author" content="Abhinav Chinnusamy" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="geo.region" content="US-WI" />
        <meta name="geo.placename" content="Madison, Wisconsin" />
        <meta name="geo.position" content="43.0731;-89.4012" />
        <meta name="ICBM" content="43.0731, -89.4012" />
        <link rel="alternate" hreflang="en-US" href="https://cabhinav.com/strava/" />
        <link rel="alternate" hreflang="x-default" href="https://cabhinav.com/strava/" />
        <meta property="og:title" content="Strava Activities - Abhinav Chinnusamy" />
        <meta property="og:description" content="Explore my running journey with activity summaries, latest rides, and upcoming races" />
        <meta property="og:image" content="https://cabhinav.com/assets/images/social/strava-twitter-card.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Strava Running Activities Dashboard" />
        <meta property="og:url" content="https://cabhinav.com/strava/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="cabhinav.com" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@emotor" />
        <meta name="twitter:creator" content="@emotor" />
        <meta name="twitter:title" content="Strava Activities - Abhinav Chinnusamy" />
        <meta name="twitter:description" content="Running activities, performance metrics, and race tracking" />
        <meta name="twitter:image" content="https://cabhinav.com/assets/images/social/strava-twitter-card.jpg" />
        <meta name="twitter:image:alt" content="Strava Running Activities" />
        <meta name="twitter:url" content="https://cabhinav.com/strava/" />
        <link rel="canonical" href="https://cabhinav.com/strava/" />
        <meta name="theme-color" content="#161618" />
        <link rel="apple-touch-icon" href="/assets/images/icons/favicon.ico" />
        <link rel="icon" href="/assets/images/icons/favicon.ico" type="image/x-icon" />
        <link rel="shortcut" icon href="/assets/images/icons/favicon.ico" type="image/x-icon" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "name": "Strava Activities - Abhinav Chinnusamy",
            "description": "Running activities, performance metrics, and race tracking",
            "url": "https://cabhinav.com/strava/",
            "mainEntity": {
              "@type": "Person",
              "name": "Abhinav Chinnusamy",
              "athlete": {
                "@type": "SportsActivity",
                "sport": "Running",
                "activityLocation": {
                  "@type": "Place",
                  "name": "Madison, Wisconsin"
                }
              }
            },
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
                  "name": "Strava Activities",
                  "item": "https://cabhinav.com/strava/"
                }
              ]
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Space Background Canvas */}
        <div id="space-background-container" ref={containerRef} className="fixed inset-0 z-0" />

        {/* Main Content */}
        <div className="relative z-10 pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            {/* Header Section */}
            <header className="text-center mb-12 lg:mb-16">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-br from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Strava Activities
              </h1>
              <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
                Track my running journey and performance metrics
              </p>
            </header>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Personal Bests Dashboard - Takes 2 columns */}
              <section className="lg:col-span-2" aria-label="Personal Best Times">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Dashboard Header */}
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-orange-500 text-2xl">timer</span>
                      <h2 className="text-xl font-semibold text-white">Personal Best Times</h2>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSort('distance')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                          sortBy === 'distance'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300 border border-gray-700'
                        }`}
                      >
                        <span>Distance</span>
                        {sortBy === 'distance' && (
                          <span className="material-symbols-outlined text-base">
                            {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => handleSort('pace')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                          sortBy === 'pace'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300 border border-gray-700'
                        }`}
                      >
                        <span>Pace</span>
                        {sortBy === 'pace' && (
                          <span className="material-symbols-outlined text-base">
                            {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stats List */}
                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                      <p className="mt-4 text-gray-400">Loading personal bests...</p>
                    </div>
                  ) : setupRequired ? (
                    <div className="p-12 text-center">
                      <div className="max-w-md mx-auto">
                        <span className="material-symbols-outlined text-6xl text-orange-500 mb-4 inline-block">link</span>
                        <h3 className="text-2xl font-semibold text-white mb-3">Setup Required</h3>
                        <p className="text-gray-400 mb-6">
                          Connect your Strava account to view your personal bests
                        </p>
                        <a
                          href={STRAVA_AUTH_URL}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/20"
                        >
                          <span className="material-symbols-outlined">link</span>
                          Connect Strava
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {sortedDistances.map((config, index) => {
                        const pb = personalBests?.[config.key];
                        const isHighlight = config.highlight;
                        
                        return (
                          <div
                            key={config.key}
                            className={`px-6 py-4 transition-all duration-200 hover:bg-gray-800/30 ${
                              isHighlight ? 'bg-gray-800/20 border-l-4 border-orange-500' : ''
                            }`}
                            style={{
                              animation: `fadeInUp 0.4s ease ${index * 0.05}s both`
                            }}
                          >
                            <div className="flex items-center justify-between flex-wrap gap-4">
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="flex-shrink-0">
                                  <span className="material-symbols-outlined text-orange-500">
                                    speed
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-300 mb-1">
                                    {config.label}
                                  </div>
                                  <div className="flex items-baseline gap-3 flex-wrap">
                                    <div className="text-lg font-mono font-semibold text-orange-400">
                                      {pb?.time_formatted || '--:--'}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono">
                                      Pace: <span className="text-gray-400">{pb?.pace_per_km || '--:--'}</span>/{config.unit}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {pb && (
                                <div className="text-xs text-gray-500 font-mono">
                                  {new Date(pb.start_date_local).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* Widgets Section - Takes 1 column */}
              <section className="space-y-8" aria-label="Strava Activity Widgets">
                {/* Latest Activities */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-500 text-xl">route</span>
                      <h2 className="text-lg font-semibold text-white">Latest Activities</h2>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900/30">
                    <iframe
                      className="w-full rounded-lg"
                      height="300"
                      width="100%"
                      style={{ border: 'none', minHeight: '300px' }}
                      allowFullScreen
                      loading="lazy"
                      title="Latest Strava Activities"
                      src="https://www.strava.com/athletes/99464226/latest-rides/63bde6a12ff1a11fb4436df5e6a8aac6b8ebb32c"
                      aria-label="Latest Strava running activities"
                    />
                  </div>
                </div>

                {/* My Half Marathon */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-orange-500 text-xl">flag</span>
                      <h2 className="text-lg font-semibold text-white">My Half Marathon</h2>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900/30">
                    <div
                      className="strava-embed-placeholder"
                      data-embed-type="activity"
                      data-embed-id="16406693132"
                      data-style="standard"
                      data-from-embed="false"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        html:has(#space-background-container),
        body:has(#space-background-container) {
          background: transparent !important;
        }

        #space-background-container {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 0 !important;
          pointer-events: none !important;
        }

        #space-background-container .space-bg-canvas {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          pointer-events: none !important;
          z-index: 0 !important;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Layout>
  );
};

export default Strava;
