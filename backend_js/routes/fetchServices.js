const PlayData = require('../mongo_models/playDataModel.js');

async function addPlayDataUser(playId, item) {
    const mods = item.mods;
    const maybePlay = await PlayData.findOne({ playId: playId });
    if (!maybePlay) {
        const newPlay = new PlayData({
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
        });
        await newPlay.save();
        console.log(`Play with playId ${playId} saved to database`);
    }
}

async function addPlayDataBeatmap(playId, beatmapDetails, item) {
    const mods = item.mods;
    const maybePlay = await PlayData.findOne({ playId: playId });
    if (!maybePlay) {
        const newPlay = new PlayData({
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
        });
        await newPlay.save();
        console.log(`Play with playId ${playId} saved to database`);
    }
}



module.exports = { addPlayDataUser, addPlayDataBeatmap };