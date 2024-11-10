const express = require('express');
const axios = require('axios');
const { getAccessToken } = require('../authentication/token');
const { ojsamaCalculatePP } = require('../calculators/ojsama-func');
const { rosuCalculatePP } = require('../calculators/rosu-pp-js-func');
const { otpcCalculatePP } = require('../calculators/osu-tools-performance-calculator-func');

const router = express.Router();

router.get('/scores/:username/:limit', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const token = await getAccessToken();
        console.log(req.params);
        const username = req.params.username || 'peppy';
        const response0 = await axios.get(`https://osu.ppy.sh/api/v2/users/@${username}/osu`, {
            params: { "key": "username" },
            headers: { "Authorization": `Bearer ${token}`}
        });
        const userId = response0.data.id;
        const response = await axios.get(`https://osu.ppy.sh/api/v2/users/${userId}/scores/best`, {
            params: { "mode": "osu", "limit": req.params.limit || 10 },
            headers: { "Authorization": `Bearer ${token}` }
        });
        const finalRes = [];
        let i = 0;
        for (let item of response.data) {
            const beatmapId = item.beatmap.id;
            const mods = item.mods;
            const accPercent = item.accuracy * 100;
            const combo = item.max_combo;
            const nmiss = item.statistics.count_miss;
            const ojsamaPP = await ojsamaCalculatePP(beatmapId, mods, accPercent, combo, nmiss);
            const rosuPP = await rosuCalculatePP(beatmapId, mods, accPercent, combo, nmiss);
            const otpcPP = await otpcCalculatePP(beatmapId, mods, accPercent, combo, nmiss);
            finalRes.push(
                { beatmap: 
                    {
                        id: beatmapId,
                        mods: mods,
                        accPercent: accPercent,
                        combo: combo,
                        nmiss: nmiss,
                        hitJudgement: item.beatmap.accuracy,
                        approachRate: item.beatmap.ar,
                        circleSize: item.beatmap.cs,
                        drainRate: item.beatmap.drain,
                        rating: item.beatmap.difficulty_rating,
                    }, 
                    ojsamaPP: parseFloat(ojsamaPP), 
                    rosuPP: parseFloat(rosuPP), 
                    otpcPP: parseFloat(otpcPP), 
                    actualPP: item.pp 
                }
            );
            // Calculate progress percentage and send it to the client
            const progress = ((i + 1) / req.params.limit) * 100;
            res.write(`data: ${JSON.stringify({ progress: progress.toFixed(2) })}\n\n`);
            console.log(`BeatmapId: ${beatmapId}, Ojsama PP: ${ojsamaPP}, Rosu PP: ${rosuPP}, OTPC PP: ${otpcPP}, Actual PP: ${item.pp}`);
            i++;
        }
        
        // Send the final data and close the connection
        res.write(`data: ${JSON.stringify({ message: "Finished processing", results: finalRes })}\n\n`);
        res.end();
    } catch (error) {
        console.error(error.message);
        
        if (!res.headersSent) {
            if (error.response?.status === 404) {
                res.write(`data: ${JSON.stringify({ error: 'No user found' })}\n\n`);
            } else {
                res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
            }
            res.end();
        }
    }
});


router.post('/beatmap/compare', async (req, res) => {
    try {
        const { beatmapId, mods, accPercent, combo, nmiss } = req.body;
        const ojsamaPP = await ojsamaCalculatePP(beatmapId, mods, accPercent, combo, nmiss);
        const rosuPP = await rosuCalculatePP(beatmapId, mods, accPercent, combo, nmiss);
        const otpcPP = await otpcCalculatePP(beatmapId, mods, accPercent, combo, nmiss);

        res.json({ ojsamaPP, rosuPP, otpcPP });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
