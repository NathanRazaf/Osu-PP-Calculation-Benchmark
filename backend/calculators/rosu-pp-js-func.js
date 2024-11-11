const axios = require('axios');
const rosu = require("rosu-pp-js");

async function fetchBeatmap(beatmapId) {
    const url = `https://osu.ppy.sh/osu/${beatmapId}`;
    const response = await axios.get(url, { responseType: 'arraybuffer' }); // Fetch as binary data
    return Buffer.from(response.data); // Convert response data to a buffer
}

async function rosuCalculatePP(beatmapId, mods = [], accPercent = 100, combo = null, nmiss = 0) {
    // Fetch the beatmap file as a buffer
    const bytes = await fetchBeatmap(beatmapId);
    let concatMods = mods.join('');

    // Parse the map.
    let map = new rosu.Beatmap(bytes);

    // Calculating performance attributes for a specific score.
    const currAttrs = new rosu.Performance({
        mods: concatMods,
        misses: nmiss,
        accuracy: accPercent,
        combo: combo,
        hitresultPriority: rosu.HitResultPriority.WorstCase,
    }).calculate(map);

    console.log(`rosu: Executing: ${beatmapId} mods ${concatMods} ${accPercent}% x${combo} misses ${nmiss}`);
    console.log(`PP: ${currAttrs.pp.toFixed(3)}`);

    // Free the beatmap manually to avoid risking memory leakage.
    map.free();

    return currAttrs.pp.toFixed(3);
}

module.exports = { rosuCalculatePP };
