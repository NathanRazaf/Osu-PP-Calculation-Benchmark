const axios = require('axios');
const UserScores = require('../mongo_models/userScoreModel');
const BeatmapScores = require('../mongo_models/beatmapScoreModel');
const { ojsamaCalculatePP } = require('../calculators/ojsama-func');
const { rosuCalculatePP } = require('../calculators/rosu-pp-js-func');
const { otpcCalculatePP } = require('../calculators/osu-tools-performance-calculator-func');
const PlayData = require('../mongo_models/playDataModel.js');

const statsUpdaterRoute = "https://osu-statistics-fetcher.onrender.com/stats/update";

async function processScores({ 
    scores, 
    limit, 
    beatmapId = null, 
    username = null, 
    beatmapDetails = null,
    res,
    force = false 
}) {
    let i = 0;
    const finalRes = [];

    for (let item of scores) {
        if (item.pp === null) {
            i++;
            continue;
        }

        const playId = item.id;
        const mods = item.mods;
        const score = item.score;
        const accPercent = item.accuracy * 100;
        const combo = item.max_combo;
        const nmiss = item.statistics.count_miss;
        
        // Determine which model and identifier to use based on the request type
        const isUserRequest = username !== null;
        const Model = isUserRequest ? UserScores : BeatmapScores;
        const identifier = isUserRequest ? username : beatmapId;
        const identifierField = isUserRequest ? 'username' : 'beatmapId';

        // Find or create document
        let document = await Model.findOne({ [identifierField]: identifier });
        let existingScore = null;
        
        if (document) {
            existingScore = document.scores.find(score => score.playId === playId);
        } else {
            document = new Model({ [identifierField]: identifier, scores: [] });
        }

        let ojsamaPP, rosuPP, otpcPP;
        // We only calculate new PP values if the score doesn't exist or if force is true
        let shouldCalculate = force || !existingScore;

        if (!shouldCalculate) {
            console.log(`Cache hit for playId ${playId}`);
            ojsamaPP = existingScore.ojsamaPP;
            rosuPP = existingScore.rosuPP;
            otpcPP = existingScore.otpcPP;
        }

        if (shouldCalculate) {
            console.log(`${force ? 'Force updating' : 'Calculating new'} PP values for playId ${playId}`);
            [ojsamaPP, rosuPP, otpcPP] = await Promise.all([
                ojsamaCalculatePP(beatmapId || item.beatmap.id, mods, accPercent, combo, nmiss),
                rosuCalculatePP(beatmapId || item.beatmap.id, mods, accPercent, combo, nmiss),
                otpcCalculatePP(beatmapId || item.beatmap.id, mods, accPercent, combo, nmiss)
            ]);

            if (ojsamaPP === null || rosuPP === null || otpcPP === null || 
                isNaN(ojsamaPP) || isNaN(rosuPP) || isNaN(otpcPP)) {
                console.log(`Skipping score with playId ${playId}`);
                i++;
                continue;
            }

            // Prepare score data
            const scoreData = {
                playId,
                score,
                ojsamaPP,
                rosuPP,
                otpcPP,
                actualPP: item.pp
            };

            // Add type-specific fields
            if (isUserRequest) {
                scoreData.beatmapId = item.beatmap.id;
            } else {
                scoreData.username = item.user.username;
            }

            if (existingScore) {
                // Update existing score
                await Model.updateOne(
                    { 
                        [identifierField]: identifier,
                        'scores.playId': playId 
                    },
                    { 
                        $set: {
                            'scores.$.ojsamaPP': ojsamaPP,
                            'scores.$.rosuPP': rosuPP,
                            'scores.$.otpcPP': otpcPP,
                            'scores.$.actualPP': item.pp,
                            'scores.$.score': score
                        }
                    }
                );
                console.log(`Updated existing score for playId ${playId}`);
            } else {
                // Add new score
                await document.addScore(scoreData);
                console.log(`Added new score for playId ${playId}`);
            }

            const obj = {
                isUserRequest,
                [identifierField]: identifier,
                playId,
                ojsamaPP,
                rosuPP,
                otpcPP,
                actualPP: item.pp
            };
            finalRes.push(obj);

            // Update stats
            // const statsUpdateResponse = await axios.post(statsUpdaterRoute, obj);
            // console.log(statsUpdateResponse.data);
        }

        // Add play data based on request type
        if (isUserRequest) {
            await addPlayDataUser(playId, item, force);
        } else {
            await addPlayDataBeatmap(playId, beatmapDetails, item, force);
        }

        const progress = ((i + 1) / limit) * 100;
        res.write(`data: ${JSON.stringify({ progress: progress.toFixed(2) })}\n\n`);
        console.log(`BeatmapId: ${beatmapId || item.beatmap.id}, Ojsama PP: ${ojsamaPP}, Rosu PP: ${rosuPP}, OTPC PP: ${otpcPP}, Actual PP: ${item.pp}\n\n`);
        i++;
    }

    return finalRes;
}

async function addPlayDataUser(playId, item, force = false) {
    const mods = item.mods;
    const maybePlay = await PlayData.findOne({ playId: playId });
    const playData = {
        playId: playId,
        actualPP: item.pp,
        accPercent: item.accuracy * 100,
        combo: item.max_combo,
        nmiss: item.statistics.count_miss,
        hitJudgement: item.beatmap.accuracy,
        approachRate: item.beatmap.ar,
        circleSize: item.beatmap.cs,
        circleCount: item.beatmap.count_circles,
        sliderCount: item.beatmap.count_sliders,
        spinnerCount: item.beatmap.count_spinners,
        bpm: item.beatmap.bpm,
        hitLength: item.beatmap.hit_length,
        drainRate: item.beatmap.drain,
        rating: item.beatmap.difficulty_rating,
        EZ: mods.includes('EZ'),
        HT: mods.includes('HT'),
        HD: mods.includes('HD'),
        DT: mods.includes('DT'),
        NC: mods.includes('NC'),
        HR: mods.includes('HR'),
        FL: mods.includes('FL')
    };

    if (maybePlay && force) {
        await PlayData.updateOne({ playId: playId }, playData);
        console.log(`Updated play data for playId ${playId}`);
    } else if (!maybePlay) {
        const newPlay = new PlayData(playData);
        await newPlay.save();
        console.log(`Play with playId ${playId} saved to database`);
    }
}

async function addPlayDataBeatmap(playId, beatmapDetails, item, force = false) {
    const mods = item.mods;
    const maybePlay = await PlayData.findOne({ playId: playId });
    const playData = {
        playId: playId,
        actualPP: item.pp,
        accPercent: item.accuracy * 100,
        combo: item.max_combo,
        nmiss: item.statistics.count_miss,
        hitJudgement: beatmapDetails.accuracy,
        approachRate: beatmapDetails.ar,
        circleSize: beatmapDetails.cs,
        circleCount: beatmapDetails.count_circles,
        sliderCount: beatmapDetails.count_sliders,
        spinnerCount: beatmapDetails.count_spinners,
        bpm: beatmapDetails.bpm,
        hitLength: beatmapDetails.hit_length,
        drainRate: beatmapDetails.drain,
        rating: beatmapDetails.difficulty_rating,
        EZ: mods.includes('EZ'),
        HT: mods.includes('HT'),
        HD: mods.includes('HD'),
        DT: mods.includes('DT'),
        NC: mods.includes('NC'),
        HR: mods.includes('HR'),
        FL: mods.includes('FL')
    };

    if (maybePlay && force) {
        await PlayData.updateOne({ playId: playId }, playData);
        console.log(`Updated play data for playId ${playId}`);
    } else if (!maybePlay) {
        const newPlay = new PlayData(playData);
        await newPlay.save();
        console.log(`Play with playId ${playId} saved to database`);
    }
}

module.exports = { addPlayDataUser, addPlayDataBeatmap, processScores };