const axios = require('axios');

async function otpcCalculatePP(beatmapId, mods = [], accPercent = 100, combo = null, nmiss = 0, sliderTailMiss = 0, largeTickMiss = 0) {
    try {
        console.log(`otpc: Executing: ${beatmapId} mods ${mods} ${accPercent}% x${combo} misses ${nmiss}`);
        const response = await axios.post('http://146.190.155.230:8080/calculate', {
            beatmapId,
            mods,
            accPercent,
            combo,
            nmiss,
            sliderTailMiss,
            largeTickMiss
        });
        console.log(`PP: ${response.data.pp}`);
        return response.data.pp;
    } catch (error) {
        console.error('Error calling PerformanceCalculator API:', error.message);
        throw new Error('Failed to calculate performance points.');
    }
}

module.exports = { otpcCalculatePP };