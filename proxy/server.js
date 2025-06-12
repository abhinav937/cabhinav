const axios = require('axios');

   module.exports = async (req, res) => {
       const API_KEY = process.env.SERPAPI_KEY || '7ebdbc804ceab3f21e0ddf0b7deca786fc1eba9e8250ce8079796aace0d0e02e';
       const SCHOLAR_ID = '40h4Uo8AAAAJ';
       const url = `https://serpapi.com/search?engine=google_scholar_author&author_id=${SCHOLAR_ID}&api_key=${API_KEY}&hl=en`;

       try {
           const response = await axios.get(url);
           res.status(200).json(response.data);
       } catch (error) {
           console.error('Proxy error:', error.message);
           res.status(500).json({ error: 'Failed to fetch publications' });
       }
   };