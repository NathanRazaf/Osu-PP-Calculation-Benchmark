const express = require('express');
const axios = require('axios');
const { getAccessToken } = require('../authentication/token');
const { ojsamaCalculatePP } = require('../calculators/ojsama-func');
const { rosuCalculatePP } = require('../calculators/rosu-pp-js-func');
const { otpcCalculatePP } = require('../calculators/osu-tools-performance-calculator-func');

const router = express.Router();

router.get('/user/scores/:username/:limit', async (req, res) => {
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
            const playId = item.id;
            const mods = item.mods;
            const score = item.score;
            const accPercent = item.accuracy * 100;
            const combo = item.max_combo;
            const nmiss = item.statistics.count_miss;
            // Calculate PP using all 3 calculators
            const [ojsamaPP, rosuPP, otpcPP] = await Promise.all([
                ojsamaCalculatePP(beatmapId, mods, accPercent, combo, nmiss),
                rosuCalculatePP(beatmapId, mods, accPercent, combo, nmiss),
                otpcCalculatePP(beatmapId, mods, accPercent, combo, nmiss)
            ]);
            finalRes.push(
                { beatmap: 
                    {
                        beatmapId: beatmapId,
                        mods: mods,
                        accPercent: accPercent.toFixed(2),
                        score: score,
                        combo: combo,
                        nmiss: nmiss,
                        hitJudgement: item.beatmap.accuracy,
                        approachRate: item.beatmap.ar,
                        circleSize: item.beatmap.cs,
                        drainRate: item.beatmap.drain,
                        rating: item.beatmap.difficulty_rating,
                    }, 
                    playId: playId,
                    ojsamaPP: ojsamaPP, 
                    rosuPP: rosuPP, 
                    otpcPP: otpcPP, 
                    actualPP: item.pp 
                }
            );
            // Calculate progress percentage and send it to the client
            const progress = ((i + 1) / req.params.limit) * 100;
            res.write(`data: ${JSON.stringify({ progress: progress.toFixed(2) })}\n\n`);
            console.log(`BeatmapId: ${beatmapId}, Ojsama PP: ${ojsamaPP}, Rosu PP: ${rosuPP}, OTPC PP: ${otpcPP}, Actual PP: ${item.pp}\n\n`);
            i++;
        }
        
        // Send the final data and close the connection
        res.write(`data: ${JSON.stringify({ message: "Finished processing", results: finalRes })}\n\n`);
        res.end();
    } catch (error) {
        console.error(error.message);
        
        if (!res.headersSent) {
            if (error.response?.status === 404) {
                res.write(`data: ${JSON.stringify({ message: 'User not found' })}\n\n`);
            } else {
                res.write(`data: ${JSON.stringify({ message: 'Internal server error' })}\n\n`);
            }
            res.end();
        }
    }
});


router.get('/beatmap/scores/:beatmapId/:limit', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const token = await getAccessToken();
        const response = await axios.get(`https://osu.ppy.sh/api/v2/beatmaps/${req.params.beatmapId}/scores`, {
            params: { "mode": "osu" },
            headers: { "Authorization": `Bearer ${token}` }
        });
        const limit = req.params.limit || 10;
        if (limit > 50) limit = 50;
        const scores = response.data.scores.slice(0, req.params.limit);  
        const finalRes = [];
        const beatmap = await axios.get(`https://osu.ppy.sh/api/v2/beatmaps/${req.params.beatmapId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        let i = 0;
        for (let item of scores) {
            const username = item.user.username;
            const playId = item.id;
            const mods = item.mods;
            const score = item.score;
            const accPercent = item.accuracy * 100;
            const combo = item.max_combo;
            const nmiss = item.statistics.count_miss;
            // Calculate PP using all 3 calculators
            const [ojsamaPP, rosuPP, otpcPP] = await Promise.all([
                ojsamaCalculatePP(req.params.beatmapId, mods, accPercent, combo, nmiss),
                rosuCalculatePP(req.params.beatmapId, mods, accPercent, combo, nmiss),
                otpcCalculatePP(req.params.beatmapId, mods, accPercent, combo, nmiss)
            ]);
            finalRes.push(
                { beatmap: 
                    {
                        beatmapId: req.params.beatmapId,
                        mods: mods,
                        accPercent: accPercent.toFixed(2),
                        score: score,
                        combo: combo,
                        nmiss: nmiss,
                        hitJudgement: beatmap.data.accuracy,
                        approachRate: beatmap.data.ar,
                        circleSize: beatmap.data.cs,
                        drainRate: beatmap.data.drain,
                        rating: beatmap.data.difficulty_rating,
                    }, 
                    username: username,
                    playId: playId,
                    ojsamaPP: ojsamaPP, 
                    rosuPP: rosuPP, 
                    otpcPP: otpcPP, 
                    actualPP: item.pp 
                }
            );
            // Calculate progress percentage and send it to the client
            const progress = ((i + 1) / limit) * 100;
            res.write(`data: ${JSON.stringify({ progress: progress.toFixed(2) })}\n\n`);
            console.log(`BeatmapId: ${req.params.beatmapId}, Ojsama PP: ${ojsamaPP}, Rosu PP: ${rosuPP}, OTPC PP: ${otpcPP}, Actual PP: ${item.pp}\n\n`);
            i++;
        }
        // Send the final data and close the connection
        res.write(`data: ${JSON.stringify({ message: "Finished processing", results: finalRes })}\n\n`);
        res.end();
    } catch (error) {
        console.error(error.message);
        
        if (!res.headersSent) {
            if (error.response?.status === 404) {
                res.write(`data: ${JSON.stringify({ message: 'Beatmap not found' })}\n\n`);
            } else {
                res.write(`data: ${JSON.stringify({ message: 'Internal server error' })}\n\n`);
            }
            res.end();
        }
    }
});

module.exports = router;
