const needle = require('needle');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'key.env' });

const BEARER_TOKEN = process.env.BEARER_TOKEN;
if (!BEARER_TOKEN) {
  throw new Error('BEARER_TOKEN environment variable is required. Set it in your key.env file.');
}

const USERNAME = 'abhinav_937';
const OUTPUT_DIR = './x-proxy';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'tweets.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Fallback tweets with user data
const FALLBACK_TWEETS = {
  data: [
    {
      id: '1788679043781124352',
      text: 'Thrilled to join Annapurna Labs (Amazon, Austin) this summer as a hardware intern on their power electronics team! https://t.co/qsZQIY5aqi',
      created_at: '2025-05-01T03:02:39.000Z',
      author_id: '987654321',
      entities: {
        urls: [{ url: 'https://t.co/qsZQIY5aqi', expanded_url: 'http://example.com', display_url: 'example.com' }]
      }
    },
    {
      id: '1786768979876543210',
      text: 'Working on some cool MOSFET designs for power electronics. Documentation is key! #PowerElectronics',
      created_at: '2025-04-30T02:31:55.000Z',
      author_id: '987654321',
      entities: {
        hashtags: [{ text: 'PowerElectronics' }]
      }
    }
  ],
  includes: {
    users: [
      {
        id: '987654321',
        name: 'Abhinav Chinnusamy',
        username: 'abhinav_937',
        profile_image_url: 'https://pbs.twimg.com/profile_images/1927391280914386945/H7odsFKa_400x400.jpg' // Replace with your actual profile image URL
      }
    ]
  }
};

async function fetchTweets() {
  const url = 'https://api.twitter.com/2/tweets/search/recent';
  const params = {
    query: `from:${USERNAME} -is:retweet -is:reply`,
    'tweet.fields': 'id,text,created_at,entities,attachments,author_id',
    'expansions': 'attachments.media_keys,author_id',
    'media.fields': 'preview_image_url,url',
    'user.fields': 'id,name,username,profile_image_url',
    max_results: 10
  };

  try {
    const response = await needle('get', url, params, {
      headers: {
        'User-Agent': 'v2RecentTweetsFetchJS',
        Authorization: `Bearer ${BEARER_TOKEN}`
      }
    });

    if (response.statusCode !== 200) {
      console.error(`Twitter API Error: ${response.statusCode} ${response.statusMessage}`, response.body);
      if (response.statusCode === 429) {
        console.error(`Rate limit exceeded. Reset time: ${new Date(parseInt(response.headers['x-rate-limit-reset']) * 1000).toLocaleString()}`);
        console.error(`Remaining requests: ${response.headers['x-rate-limit-remaining']}/${response.headers['x-rate-limit-limit']}`);
      }
      console.warn('Falling back to static tweets due to API error.');
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(FALLBACK_TWEETS, null, 2));
      console.log(`Fallback tweets saved to ${OUTPUT_FILE}`);
      return;
    }

    const data = response.body;
    if (!data?.data) {
      console.warn('No tweets found, falling back to static tweets.');
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(FALLBACK_TWEETS, null, 2));
      console.log(`Fallback tweets saved to ${OUTPUT_FILE}`);
      return;
    }

    // Save tweets to a file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`Tweets saved to ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('Request failed:', err.message);
    console.warn('Falling back to static tweets due to request failure.');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(FALLBACK_TWEETS, null, 2));
    console.log(`Fallback tweets saved to ${OUTPUT_FILE}`);
  }
}

fetchTweets();