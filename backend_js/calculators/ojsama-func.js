const axios = require('axios');
const osu = require('ojsama');
const { client } = require('../redisClient');


async function fetchBeatmap(beatmapId) {
    const url = `https://osu.ppy.sh/osu/${beatmapId}`;
    const response = await axios.get(url);
    return response.data; // .osu file contents
}

async function ojsamaCalculatePP(beatmapId, mods = [], accPercent = 100, combo = null, nmiss = 0) {
    // Generate a unique cache key based on the parameters
    const cacheKey = `pp_${beatmapId}_${mods.join('')}_${accPercent}_${combo}_${nmiss}`;

    try {
        // Check Redis cache
        const cachedPP = await client.get(cacheKey);
        if (cachedPP) {
            console.log(`Cache hit for: ${cacheKey}`);
            return cachedPP;
        }

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

        // Store result in Redis with an expiration time
        await client.set(cacheKey, ppResult, 'EX', 86400); // Expires in 1 day
        return ppResult;
    } catch (error) {
        console.error(`Error in ojsamaCalculatePP: ${error.message}`);
        throw error;
    }
}

// Gracefully shut down Redis client when the application stops
process.on('SIGINT', async () => {
    if (client.isOpen) {
        await client.quit();
        console.log('Redis client disconnected');
    }
    process.exit();
});

module.exports = { ojsamaCalculatePP };
