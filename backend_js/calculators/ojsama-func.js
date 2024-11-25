const axios = require('axios');
const osu = require('ojsama');


async function fetchBeatmap(beatmapId) {
    const url = `https://osu.ppy.sh/osu/${beatmapId}`;
    const response = await axios.get(url);
    return response.data; // .osu file contents
}

async function ojsamaCalculatePP(beatmapId, mods = [], accPercent = 100, combo = null, nmiss = 0) {
    try {

        // Fetch beatmap data if not cached
        const mapData = await fetchBeatmap(beatmapId);
        const parser = new osu.parser();
        parser.feed(mapData);
        const map = parser.map;

        if (mods) {
            mods = osu.modbits.from_string(mods.join(''));
        }

        const stars = new osu.diff().calc({ map: map, mods: mods });

        const pp = osu.ppv2({
            stars: stars,
            combo: combo,
            nmiss: nmiss,
            acc_percent: accPercent,
        });
        
        const ppResult = pp.total.toFixed(3);
        console.log(`ojsama: Executing: ${beatmapId} stars ${stars} mods ${mods} ${accPercent}% x${combo} misses ${nmiss}`);
        console.log(`PP: ${ppResult}`);

        return ppResult;
    } catch (error) {
        console.error(`Error in ojsamaCalculatePP: ${error.message}`);
        throw error;
    }
}

module.exports = { ojsamaCalculatePP };
