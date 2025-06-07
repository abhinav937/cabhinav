const express = require('express');
const needle = require('needle');
const cors = require('cors');
const path = require('path');
const flatCache = require('flat-cache');
require('dotenv').config({ path: path.resolve(__dirname, 'key.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize flat-cache (file-based cache)
const cache = flatCache.load('tweetsCache', path.resolve(__dirname, 'cache'));

// Require BEARER_TOKEN from environment
const BEARER_TOKEN = process.env.BEARER_TOKEN;
if (!BEARER_TOKEN) {
  throw new Error('BEARER_TOKEN environment variable is required. Set it in your key.env file.');
}

// Allow CORS from local development and production origins
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'https://cabhinav.com']
}));

app.get('/tweets/:username', async (req, res) => {
  const username = req.params.username;
  const cacheKey = `tweets:${username}`;
  const cachedData = cache.getKey(cacheKey);

  if (cachedData) {
    console.log(`Cache hit for ${cacheKey}`);
    return res.status(200).json(cachedData);
  }

  const url = `https://api.twitter.com/2/tweets/search/recent`;
  const params = {
    'query': `from:${username} -is:retweet`,
    'tweet.fields': 'id,text,created_at,entities,attachments',
    'expansions': 'attachments.media_keys',
    'media.fields': 'preview_image_url,url',
    'max_results': 10 // Set to 10 to comply with API requirements (min 10, max 100)
  };

  try {
    const response = await needle('get', url, params, {
      headers: {
        "User-Agent": "v2RecentTweetsFetchJS",
        "Authorization": `Bearer ${BEARER_TOKEN}`
      }
    });

    const data = response.body;

    if (response.statusCode !== 200) {
      console.error(`Twitter API Error: ${response.statusCode} ${response.statusMessage}`, data);
      if (response.statusCode === 429) {
        const fallbackData = cache.getKey(cacheKey);
        if (fallbackData) {
          console.log(`Rate limit exceeded, falling back to cached data for ${cacheKey}`);
          return res.status(200).json(fallbackData);
        }
        return res.status(response.statusCode).json({
          error: 'Twitter API Error',
          status: response.statusCode,
          resetTime: response.headers['x-rate-limit-reset'],
          remaining: response.headers['x-rate-limit-remaining'],
          limit: response.headers['x-rate-limit-limit'],
          details: 'Rate limit exceeded on Free tier (1 request per 15 minutes, 100 tweets per month, 10 requests at 10 tweets each). Please wait 15 minutes or until the monthly limit resets, upgrade to Basic tier, or use the timeline embed below.'
        });
      }
      return res.status(response.statusCode).json({
        error: 'Twitter API Error',
        status: response.statusCode,
        details: data
      });
    }

    if (!data?.data) {
      return res.status(404).json({
        error: 'No tweets found',
        details: data
      });
    }

    // Cache the successful response
    cache.setKey(cacheKey, data);
    cache.save(true); // Persist cache to file
    res.status(200).json(data);
  } catch (err) {
    console.error('Request failed:', err.stack);
    res.status(500).json({
      error: 'Internal Server Error',
      details: err.message,
      stack: err.stack
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running at http://localhost:${PORT}`);
});