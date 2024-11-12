const axios = require('axios');
const rosu = require("rosu-pp-js");
const { client } = require('../redisClient'); // Import the Redis client

async function fetchBeatmap(beatmapId) {
    const url = `https://osu.ppy.sh/osu/${beatmapId}`;
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
}

async function rosuCalculatePP(beatmapId, mods = [], accPercent = 100, combo = null, nmiss = 0) {
    const cacheKey = `rosu:${beatmapId}:${mods.join('')}:${accPercent}:${combo}:${nmiss}`;

    try {
        // Check for cached value
        const cachedPP = await client.get(cacheKey);
        if (cachedPP) {
            console.log(`Cache hit for ${cacheKey}`);
            return parseFloat(cachedPP);
        }

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

        console.log(`rosu: Executing: ${beatmapId} mods ${concatMods} ${accPercent}% x${combo} misses ${nmiss}`);
        console.log(`PP: ${currAttrs.pp.toFixed(3)}`);

        map.free();

        const ppValue = currAttrs.pp.toFixed(3);
        // Cache the result with a 1-hour expiration
        await client.set(cacheKey, ppValue, { EX: 3600 });

        return ppValue;
    } catch (error) {
        console.error(`Error in rosuCalculatePP: ${error.message}`);
        throw error;
    }
}

// Handle Redis client disconnection on shutdown
process.on('SIGINT', async () => {
    if (client.isOpen) {
        await client.quit();
        console.log('Redis client disconnected');
    }
    process.exit();
});

module.exports = { rosuCalculatePP };
