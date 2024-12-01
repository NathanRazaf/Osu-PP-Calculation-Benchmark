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



module.exports = { addPlayDataUser };