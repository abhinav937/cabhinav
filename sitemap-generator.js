const SitemapGenerator = require('sitemap-generator');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Always use the root folder for sitemap.xml
const sitemapPath = path.resolve(__dirname, 'sitemap.xml');

// Create generator instance
const generator = SitemapGenerator('https://cabhinav.com', {
  filepath: sitemapPath, // Save to project root
  maxEntriesPerFile: 50000,  // Sitemap protocol limit
  maxDepth: 10,              // Deep crawling for potential pages
  stripQuerystring: true,    // Ignore query strings
  lastMod: true,             // Include <lastmod> tag
  changeFreq: 'monthly',     // Default change frequency
  priority: 0.8,             // Default priority
  maxConcurrency: 3,         // Limit server load
  ignoreErrors: false,       // Stop on errors for debugging
  userAgent: 'SitemapGenerator/1.0 (cabhinav.com SEO Bot)', // Custom user agent
});

// Get crawler instance
const crawler = generator.getCrawler();

// Exclude unwanted file types
crawler.addFetchCondition((queueItem) => {
  return !queueItem.path.match(/\.(pdf|css|js|woff|woff2|ttf|svg)$/);
});

// Helper function to get last modified date from server or fallback to current date
async function getLastModified(url) {
  try {
    const response = await axios.head(url);
    const lastModHeader = response.headers['last-modified'];
    if (lastModHeader) {
      return new Date(lastModHeader).toISOString().split('T')[0];
    }
  } catch (error) {
    console.warn(`Could not fetch last-modified for ${url}: ${error.message}`);
  }
  return new Date().toISOString().split('T')[0]; // Fallback to current date
}

// Manually add important pages with dynamic lastmod
crawler.on('crawlstart', async () => {
  const sitemap = generator.getSitemap();
  const importantPages = [
    { url: 'https://cabhinav.com/', changefreq: 'monthly', priority: 1.0 },
    // Add future pages here, e.g.:
    // { url: 'https://cabhinav.com/projects', changefreq: 'weekly', priority: 0.9 },
    // { url: 'https://cabhinav.com/blog', changefreq: 'weekly', priority: 0.8 },
  ];

  for (const page of importantPages) {
    const lastmod = await getLastModified(page.url);
    sitemap.addURL(page.url, {
      lastmod,
      changefreq: page.changefreq,
      priority: page.priority
    });
  }
});

// Enhanced logging
generator.on('add', (url) => {
  console.log(`Added URL: ${url}`);
});
generator.on('ignore', (url) => {
  console.log(`Ignored URL: ${url}`);
});
generator.on('error', (error) => {
  console.error(`Error crawling ${error.url}: ${error.message} (Code: ${error.code})`);
});

generator.on('done', () => {
  console.log(`Sitemap generated successfully at ${sitemapPath}`);

  // List of images to highlight for the homepage
  const homepageImages = [
    'https://cabhinav.com/assets/Projects/yeswegan1.JPEG',
    'https://cabhinav.com/assets/Projects/gan.webp',
    'https://cabhinav.com/assets/Projects/opav2.webp'
  ];

  fs.access(sitemapPath, fs.constants.F_OK, (err) => {
    if (err) {
      // File does not exist, create an empty sitemap
      fs.writeFileSync(sitemapPath, '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"></urlset>');
      console.log('Created empty sitemap.xml');
    }
    // Now read, inject images, and validate
    fs.readFile(sitemapPath, 'utf-8', (err, data) => {
      if (err) {
        console.error('Error reading sitemap:', err);
        return;
      }
      // Ensure <urlset> has the image namespace
      let newData = data.replace(
        /<urlset ([^>]+)>/,
        (match, attrs) => {
          if (!attrs.includes('xmlns:image')) {
            return `<urlset ${attrs} xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
          }
          return match;
        }
      );
      // Add <image:image> tags to the homepage entry
      newData = newData.replace(
        /(<url>\s*<loc>https:\/\/cabhinav\.com\/<\/loc>)/,
        (match) => {
          const imagesXml = homepageImages.map(
            img => `<image:image><image:loc>${img}</image:loc></image:image>`
          ).join('');
          return match + imagesXml;
        }
      );
      // Overwrite the sitemap with the new data
      fs.writeFileSync(sitemapPath, newData, 'utf-8');
      // Basic validation: check for XML structure and URLs
      if (!newData.includes('<urlset') || !newData.includes('<url>')) {
        console.error('Invalid sitemap: Missing urlset or url tags');
      } else {
        // Count <url> tags as the number of URLs
        const urlCount = (newData.match(/<url>/g) || []).length;
        console.log(`Total URLs: ${urlCount}`);
        console.log('Sitemap validated successfully (with images)');
      }
    });
  });
});

generator.start();