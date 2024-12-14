const axios = require('axios');
const UserScores = require('../mongo_models/userScoreModel');
const BeatmapScores = require('../mongo_models/beatmapScoreModel');
const { ojsamaCalculatePP } = require('../calculators/ojsama-func');
const { rosuCalculatePP } = require('../calculators/rosu-pp-js-func');
const { otpcCalculatePP } = require('../calculators/osu-tools-performance-calculator-func');
const PlayData = require('../mongo_models/playDataModel.js');

const updateUrl = 'https://osu-statistics-fetcher.onrender.com/stats/update';

async function processScores({ 
    scores, // The array of scores to process
    limit, // The limit of scores to process
    beatmapId = null, // The beatmapId if the request is for beatmap scores
    username = null, // The username if the request is for user scores
    beatmapDetails = null, // The beatmap details if the request is for beatmap scores
    res // The response object to send progress updates 
}) {
    let i = 0;
    const finalRes = [];

    for (let item of scores) {
        // Skip scores with no pp
        if (item.pp === null) {
            i++;
            continue;
        }

        // Get score data
        const playId = item.id;
        const mods = item.mods.map(mod => mod.acronym);
        const score = item.classic_total_score;
        const accPercent = item.accuracy * 100;
        const combo = item.max_combo;
        const nmiss = item.statistics.miss || 0;
        const largeTickMiss = item.statistics.large_tick_miss || 0;
        const sliderTailMiss = item.maximum_statistics.slider_tail_hit - item.statistics.slider_tail_hit || 0;
        

        // Choose between UserScores and BeatmapScores depending on the request
        const isUserRequest = username !== null;
        const Model = isUserRequest ? UserScores : BeatmapScores;
        const identifier = isUserRequest ? username : beatmapId;
        const identifierField = isUserRequest ? 'username' : 'beatmapId';

        let document = await Model.findOne({ [identifierField]: identifier });
        let existingScore = null;
        
        // If the document exists, check if the score already exists. Else, create a new document
        if (document) {
            existingScore = document.scores.find(score => score.playId === playId);
        } else {
            document = new Model({ [identifierField]: identifier, scores: [] });
        }

        let ojsamaPP, rosuPP, otpcPP;

        // If the score already exists, use the existing pp values. Else, calculate new pp values
        if (existingScore) {
            console.log(`Cache hit for playId ${playId}`);
            ojsamaPP = existingScore.ojsamaPP;
            rosuPP = existingScore.rosuPP;
            otpcPP = existingScore.otpcPP;
        } else {
            console.log(`Calculating new PP values for playId ${playId}`);
            [ojsamaPP, rosuPP, otpcPP] = await Promise.all([
                ojsamaCalculatePP(beatmapId || item.beatmap_id, mods, accPercent, combo, nmiss),
                rosuCalculatePP(beatmapId || item.beatmap_id, mods, accPercent, combo, nmiss),
                otpcCalculatePP(beatmapId || item.beatmap_id, mods, accPercent, combo, nmiss, sliderTailMiss, largeTickMiss)
            ]);

            // Skip scores with invalid pp values
            if (ojsamaPP === null || rosuPP === null || otpcPP === null || 
                isNaN(ojsamaPP) || isNaN(rosuPP) || isNaN(otpcPP)) {
                console.log(`Skipping score with playId ${playId}`);
                i++;
                continue;
            }

            // Prepare data for saving
            const scoreData = {
                playId,
                score,
                ojsamaPP,
                rosuPP,
                otpcPP,
                actualPP: item.pp
            };
    
            // Use the right identifier field 
            if (isUserRequest) {
                scoreData.beatmapId = item.beatmap.id;
            } else {
                scoreData.username = item.user.username;
            }
            
            // Call the addScore method of the document
            await document.addScore(scoreData);
            console.log(`Added new score for playId ${playId}`);
              
        }

        // Add the play data to the database for future operations
        if (isUserRequest) {
            await addPlayDataUser(playId, item, mods);  
        } else {
            await addPlayDataBeatmap(playId, beatmapDetails, item, mods);  
        }

        // Add the data to the final response
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

        // Send the data to the update endpoint
        await axios.post(updateUrl, obj);

        
        // Send the user a progress update
        const progress = ((i + 1) / limit) * 100;
        res.write(`data: ${JSON.stringify({ progress: progress.toFixed(2) })}\n\n`);
        console.log(`BeatmapId: ${beatmapId || item.beatmap.id}, Ojsama PP: ${ojsamaPP}, Rosu PP: ${rosuPP}, OTPC PP: ${otpcPP}, Actual PP: ${item.pp}\n\n`);
        i++;
    }

    return finalRes;
}

async function addPlayDataUser(playId, item, mods) {
    // Check if the play already exists
    const maybePlay = await PlayData.findOne({ playId: playId });

    // If it doesn't,
    if (!maybePlay) {
        // Prepare the data for saving
        const playData = {
            playId: playId,
            actualPP: item.pp,
            accPercent: item.accuracy * 100,
            combo: item.max_combo,
            nmiss: item.statistics.miss || 0,
            hitJudgement: item.beatmap.accuracy,
            approachRate: item.beatmap.ar,
            circleSize: item.beatmap.cs,
            circleCount: item.beatmap.count_circles,
            sliderCount: item.beatmap.count_sliders,
            spinnerCount: item.beatmap.count_spinners,
            largeTickHits: item.statistics.large_tick_hit || 0,
            largeTickMisses: item.statistics.large_tick_miss || 0,
            sliderTailHits: item.statistics.slider_tail_hit || 0,
            sliderTailMisses: item.maximum_statistics.slider_tail_hit - item.statistics.slider_tail_hit || 0,
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
            FL: mods.includes('FL'),
            CL: mods.includes('CL')  
        };
        // Save the data to the database
        const newPlay = new PlayData(playData);
        await newPlay.save();
        console.log(`Play with playId ${playId} saved to database`);
    }
}

async function addPlayDataBeatmap(playId, beatmapDetails, item, mods) {
    // Check if the play already exists
    const maybePlay = await PlayData.findOne({ playId: playId });

    // If it doesn't,
    if (!maybePlay) {
        // Prepare the data for saving
        const playData = {
            playId: playId,
            actualPP: item.pp,
            accPercent: item.accuracy * 100,
            combo: item.max_combo,
            nmiss: item.statistics.miss || 0,
            hitJudgement: beatmapDetails.accuracy,
            approachRate: beatmapDetails.ar,
            circleSize: beatmapDetails.cs,
            circleCount: beatmapDetails.count_circles,
            sliderCount: beatmapDetails.count_sliders,
            spinnerCount: beatmapDetails.count_spinners,
            largeTickHits: item.statistics.large_tick_hit || 0,
            largeTickMisses: item.statistics.large_tick_miss || 0,
            sliderTailHits: item.statistics.slider_tail_hit || 0,
            sliderTailMisses: item.maximum_statistics.slider_tail_hit - item.statistics.slider_tail_hit || 0,
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
            FL: mods.includes('FL'),
            CL: mods.includes('CL')  
        };
        // Save the data to the database
        const newPlay = new PlayData(playData);
        await newPlay.save();
        console.log(`Play with playId ${playId} saved to database`);
    }
}

module.exports = { addPlayDataUser, addPlayDataBeatmap, processScores };