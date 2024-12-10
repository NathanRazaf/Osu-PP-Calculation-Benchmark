// scoresRouter.js
const express = require('express');
const axios = require('axios');
const { getAccessToken } = require('../authentication/token');
const { processScores } = require('./fetchServices');

const router = express.Router();

// Helper function to set SSE headers
function setSSEHeaders(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
}

// Helper function to handle errors
function handleError(error, res) {
    console.error(error.message);
    if (!res.headersSent) {
        const message = error.response?.status === 404 
            ? 'Not found' 
            : 'Internal server error';
        res.write(`data: ${JSON.stringify({ message })}\n\n`);
        res.end();
    }
}

router.get('/user/scores/:username/:limit', async (req, res) => {
    setSSEHeaders(res);

    try {
        const token = await getAccessToken();
        const username = req.params.username || 'peppy';
        const force = req.query.force === 'true';
        
        // Get user ID
        const userResponse = await axios.get(`https://osu.ppy.sh/api/v2/users/@${username}/osu`, {
            params: { "key": "username" },
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        // Get user scores
        const scoresResponse = await axios.get(`https://osu.ppy.sh/api/v2/users/${userResponse.data.id}/scores/best`, {
            params: { "mode": "osu", "limit": req.params.limit || 10 },
            headers: { "Authorization": `Bearer ${token}` }
        });

        const finalRes = await processScores({
            scores: scoresResponse.data,
            limit: req.params.limit,
            username,
            res,
            force
        });

        res.write(`data: ${JSON.stringify({ message: "Finished processing", results: finalRes })}\n\n`);
        res.end();
    } catch (error) {
        handleError(error, res);
    }
});

router.get('/beatmap/scores/:beatmapId/:limit', async (req, res) => {
    setSSEHeaders(res);

    try {
        const token = await getAccessToken();
        const beatmapId = req.params.beatmapId;
        const limit = Math.min(req.params.limit || 10, 50);
        const force = req.query.force === 'true';

        // Get beatmap scores
        const scoresResponse = await axios.get(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}/scores`, {
            params: { "mode": "osu" },
            headers: { "Authorization": `Bearer ${token}` }
        });

        // Get beatmap details
        const beatmapResponse = await axios.get(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const finalRes = await processScores({
            scores: scoresResponse.data.scores.slice(0, limit),
            limit,
            beatmapId,
            beatmapDetails: beatmapResponse.data,
            res,
            force
        });

        res.write(`data: ${JSON.stringify({ message: "Finished processing", results: finalRes })}\n\n`);
        res.end();
    } catch (error) {
        handleError(error, res);
    }
});

router.get('/country/best/:country/:page', async (req, res) => {
    setSSEHeaders(res);

    try {
        const token = await getAccessToken();
        const response = await axios.get(`https://osu.ppy.sh/api/v2/rankings/osu/performance`, {
            params: { 
                "country": req.params.country, 
                "cursor": {
                    "page": req.params.page
                }
            },
            headers: { "Authorization": `Bearer ${token}` }
        });

        res.send(response.data).code(200);
    } catch (error) {
        handleError(error, res);
    }
});

module.exports = router;