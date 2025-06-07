const needle = require('needle');
const fs = require('fs');
require('dotenv').config({ path: 'key.env' });

const BEARER_TOKEN = process.env.BEARER_TOKEN;
if (!BEARER_TOKEN) {
  throw new Error('BEARER_TOKEN environment variable is required. Set it in your key.env file.');
}

const USERNAME = 'abhinav_937';
const OUTPUT_FILE = 'tweets.json';

// Fallback tweets in case the API call fails
const FALLBACK_TWEETS = {
  data: [
    {
      id: "1788679043781124352",
      text: "thrilled to join annapurna labs (amazon, austin) this summer as a hardware intern on their power electronics team! https://t.co/qsZQIY5aqi",
      created_at: "2025-05-01T03:02:39.000Z",
      entities: {
        urls: [{ url: "https://t.co/qsZQIY5aqi", expanded_url: "http://example.com", display_url: "example.com" }]
      }
    },
    {
      id: "1786768979876543210",
      text: "@abhijit86k They're awesome. Idk why soldering microscopes doesn't come with this as default attachment. And for some reason the polarizers are costly too.",
      created_at: "2025-04-30T02:31:55.000Z",
      entities: {
        mentions: [{ username: "abhijit86k" }]
      }
    }
  ],
  includes: {}
};

async function fetchTweets() {
  const url = `https://api.twitter.com/2/tweets/search/recent`;
  const params = {
    'query': `from:${USERNAME} -is:retweet`,
    'tweet.fields': 'id,text,created_at,entities,attachments',
    'expansions': 'attachments.media_keys',
    'media.fields': 'preview_image_url,url',
    'max_results': 10
  };

  try {
    const response = await needle('get', url, params, {
      headers: {
        "User-Agent": "v2RecentTweetsFetchJS",
        "Authorization": `Bearer ${BEARER_TOKEN}`
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