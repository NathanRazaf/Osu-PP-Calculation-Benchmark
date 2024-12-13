const axios = require('axios');
const rosu = require("rosu-pp-js");


async function fetchBeatmap(beatmapId) {
    const url = `https://osu.ppy.sh/osu/${beatmapId}`;
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
}

async function rosuCalculatePP(beatmapId, mods = [], accPercent = 100, combo = null, nmiss = 0) {
    try {
        const bytes = await fetchBeatmap(beatmapId);
        const concatMods = mods.join('');
        let map = new rosu.Beatmap(bytes);

        const currAttrs = new rosu.Performance({
            mods: concatMods,
            misses: nmiss,
            accuracy: accPercent,
            combo: combo,
            hitresultPriority: rosu.HitResultPriority.WorstCase,
        }).calculate(map);

        console.log(`rosu-PP: ${currAttrs.pp.toFixed(3)}`);

        map.free();

        const ppValue = parseFloat(currAttrs.pp.toFixed(3));

        return ppValue;
    } catch (error) {
        console.error(`Error in rosuCalculatePP: ${error.message}`);
        throw error;
    }
}

module.exports = { rosuCalculatePP };
