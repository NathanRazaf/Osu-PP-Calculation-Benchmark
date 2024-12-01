const axios = require('axios');

async function otpcCalculatePP(beatmapId, mods = [], accPercent = 100, combo = null, nmiss = 0) {
    try {
        const response = await axios.post('http://146.190.155.230:8080/calculate', {
            beatmapId,
            mods,
            accPercent,
            combo,
            nmiss,
        });
        return response.data.pp;
    } catch (error) {
        console.error('Error calling PerformanceCalculator API:', error.message);
        throw new Error('Failed to calculate performance points.');
    }
}

module.exports = { otpcCalculatePP };