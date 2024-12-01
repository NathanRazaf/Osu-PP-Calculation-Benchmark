const express = require('express');
const axios = require('axios');
const { getAccessToken } = require('../authentication/token');
const { ojsamaCalculatePP } = require('../calculators/ojsama-func');
const { rosuCalculatePP } = require('../calculators/rosu-pp-js-func');
const { otpcCalculatePP } = require('../calculators/osu-tools-performance-calculator-func');
const { addPlayDataUser } = require('./fetchServices');
const UserScores = require('../mongo_models/userScoreModel');
const BeatmapScores = require('../mongo_models/beatmapScoreModel');

const router = express.Router();

const statsUpdaterRoute = "https://osu-statistics-fetcher.onrender.com/stats/update";

router.get('/user/scores/:username/:limit', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

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
        let i = 0;
        
        const finalRes = [];

        for (let item of response.data) {
            if (item.pp === null) {
                // Skip scores with null pp
                i++;                
                continue;
            }
            const beatmapId = item.beatmap.id;
            const playId = item.id;
            const mods = item.mods;
            const score = item.score;
            const accPercent = item.accuracy * 100;
            const combo = item.max_combo;
            const nmiss = item.statistics.count_miss;

            // Vérifier si le playId est déjà dans la base de données pour éviter le recalcul
            let user = await UserScores.findOne({ username : username });
            let existingScore = null;
            if (user) {
                existingScore = user.scores.find(score => score.playId === playId);
            } else {
                user = new UserScores({ username: username, scores: [] });
            }
            let ojsamaPP, rosuPP, otpcPP;

            if (existingScore) {
                console.log(`Cache hit for playId ${playId}`);
                ojsamaPP = existingScore.ojsamaPP;
                rosuPP = existingScore.rosuPP;
                otpcPP = existingScore.otpcPP;
            } else {
                // Calculer PP si les données n'existent pas dans la base de données
                [ojsamaPP, rosuPP, otpcPP] = await Promise.all([
                    ojsamaCalculatePP(beatmapId, mods, accPercent, combo, nmiss),
                    rosuCalculatePP(beatmapId, mods, accPercent, combo, nmiss),
                    otpcCalculatePP(beatmapId, mods, accPercent, combo, nmiss)
                ]);

                console.log(`ojsamaPP: ${ojsamaPP}, rosuPP: ${rosuPP}, otpcPP: ${otpcPP}`);
                // Ne pas ajouter les scores avec des valeurs de PP nulles ou NaN
                if (ojsamaPP === null || rosuPP === null || otpcPP === null || isNaN(ojsamaPP) || isNaN(rosuPP) || isNaN(otpcPP)) {
                    console.log(`Skipping score with playId ${playId}`);
                    i++;
                    continue;
                }

                // Enregistrer dans la base de données pour éviter les recalculs futurs
                await user.addScore({
                    playId: playId,
                    beatmapId: beatmapId,
                    score: score,
                    ojsamaPP: ojsamaPP,
                    rosuPP: rosuPP,
                    otpcPP: otpcPP,
                    actualPP: item.pp
                });

                // Push the score to the final response in a simplified format if it's not already in the database
                const obj = {
                    beatmapId: beatmapId,
                    playId: playId,
                    ojsamaPP: ojsamaPP,
                    rosuPP: rosuPP,
                    otpcPP: otpcPP,
                    actualPP: item.pp
                    };
                finalRes.push(obj);

                // Call the stats updater route to update the stats, with obj as the body
                const statsUpdateResponse = await axios.post(statsUpdaterRoute, obj);
                console.log(statsUpdateResponse.data);
            }

            await addPlayDataUser(playId, item);

            const progress = ((i + 1) / req.params.limit) * 100;
            res.write(`data: ${JSON.stringify({ progress: progress.toFixed(2) })}\n\n`);
            console.log(`BeatmapId: ${beatmapId}, Ojsama PP: ${ojsamaPP}, Rosu PP: ${rosuPP}, OTPC PP: ${otpcPP}, Actual PP: ${item.pp}\n\n`);
            i++;
        }

        // Return the final response
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
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        const token = await getAccessToken();
        const beatmapId = req.params.beatmapId;
        const response = await axios.get(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}/scores`, {
            params: { "mode": "osu" },
            headers: { "Authorization": `Bearer ${token}` }
        });
        const limit = Math.min(req.params.limit || 10, 50);
        const scores = response.data.scores.slice(0, limit);  
        
        let i = 0;
        const finalRes = [];

        for (let item of scores) {
            if (item.pp === null) { 
                // Skip scores with null pp
                i++;
                continue;
            }
            const username = item.user.username;
            const playId = item.id;
            const mods = item.mods;
            const score = item.score;
            const accPercent = item.accuracy * 100;
            const combo = item.max_combo;
            const nmiss = item.statistics.count_miss;
            

            // Vérifier si le playId est déjà dans la base de données pour éviter le recalcul
            let beatmap = await BeatmapScores.findOne({ beatmapId : beatmapId });
            let existingScore = null;
            if (beatmap) {
                existingScore = beatmap.scores.find(score => score.playId === playId);
            } else {
                beatmap = new BeatmapScores({ beatmapId : beatmapId, scores: [] });
            }
            let ojsamaPP, rosuPP, otpcPP;

            if (existingScore) {
                console.log(`Cache hit for playId ${playId}`);
                ojsamaPP = existingScore.ojsamaPP;
                rosuPP = existingScore.rosuPP;
                otpcPP = existingScore.otpcPP;
            } else {
                console.log(`Cache miss for playId ${playId}`);
                // Calculer PP si les données n'existent pas dans la base de données
                [ojsamaPP, rosuPP, otpcPP] = await Promise.all([
                    ojsamaCalculatePP(beatmapId, mods, accPercent, combo, nmiss),
                    rosuCalculatePP(beatmapId, mods, accPercent, combo, nmiss),
                    otpcCalculatePP(beatmapId, mods, accPercent, combo, nmiss)
                ]);

                // Ne pas ajouter les scores avec des valeurs de PP nulles ou NaN
                if (ojsamaPP === null || rosuPP === null || otpcPP === null || isNaN(ojsamaPP) || isNaN(rosuPP) || isNaN(otpcPP)) {
                    console.log(`Skipping score with playId ${playId}`);
                    i++;
                    continue;
                }


                // Enregistrer dans la base de données pour éviter les recalculs futurs
                await beatmap.addScore({
                    playId: playId,
                    username: username,
                    score: score,
                    ojsamaPP: ojsamaPP,
                    rosuPP: rosuPP,
                    otpcPP: otpcPP,
                    actualPP: item.pp
                });

                // Push the score to the final response in a simplified format
                const obj = {
                    beatmapId: beatmapId,
                    playId: playId,
                    ojsamaPP: ojsamaPP,
                    rosuPP: rosuPP,
                    otpcPP: otpcPP,
                    actualPP: item.pp
                    };
                finalRes.push(obj);

                // Call the stats updater route to update the stats, with obj as the body
                console.log("Calling stats updater route");
                const statsUpdateResponse = await axios.post(statsUpdaterRoute, obj);
                console.log(statsUpdateResponse.data);
            }

            const progress = ((i + 1) / limit) * 100;
            res.write(`data: ${JSON.stringify({ progress: progress.toFixed(2) })}\n\n`);
            console.log(`BeatmapId: ${req.params.beatmapId}, Ojsama PP: ${ojsamaPP}, Rosu PP: ${rosuPP}, OTPC PP: ${otpcPP}, Actual PP: ${item.pp}\n\n`);
            i++;

            
        }

        // Return the final response with the scores in a simplified format
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

router.get('/country/best/:country/:page', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        const token = await getAccessToken();
        const response = await axios.get(`https://osu.ppy.sh/api/v2/rankings/osu/performance`, {
            params: { "country": req.params.country, 
                "cursor": {
                    "page": req.params.page
                }
            },
            headers: { "Authorization": `Bearer ${token}` }
        });

        res.send(response.data).code(200);
    } catch (error) {
        console.error(error.message);
        
        if (!res.headersSent) {
            if (error.response?.status === 404) {
                res.write(`data: ${JSON.stringify({ message: 'Country not found' })}\n\n`);
            } else {
                res.write(`data: ${JSON.stringify({ message: 'Internal server error' })}\n\n`);
            }
            res.end();
        }
    }

});

module.exports = router;
