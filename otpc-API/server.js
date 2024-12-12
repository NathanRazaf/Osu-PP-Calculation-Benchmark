const fastify = require('fastify')({ logger: true });
const dotenv = require('dotenv');
dotenv.config();
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { getAccessToken } = require('./token');

async function getScoreDetails(scoreId) {
    try {
        const token = await getAccessToken();
        const response = await axios.get(`https://osu.ppy.sh/api/v2/scores/${scoreId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "x-api-version": 20220705
            }
        })
        const data = response.data;
        const beatmapId = data.beatmap_id;
        const mods = data.mods.map((mod) => mod.acronym);
        const accPercent = data.accuracy * 100;
        const combo = data.max_combo;
        const nmiss = data.statistics.miss || 0;
        const largeTickMiss = data.statistics.large_tick_miss || 0;
        const sliderTailMiss = (data.maximum_statistics.slider_tail_hit - data.statistics.slider_tail_hit) || 0;
        const scoreParams = { beatmapId, mods, accPercent, combo, nmiss, sliderTailMiss, largeTickMiss };
        return scoreParams;
    } catch (error) {
        throw error;
    }
}

async function deleteCacheFile(beatmapId) {
    const cacheFilePath = path.join(__dirname, './cache', `${beatmapId}.osu`);
    console.log(`Deleting cache file: ${cacheFilePath}`);
    if (fs.existsSync(cacheFilePath)) {
        fs.unlinkSync(cacheFilePath, (err) => {
            if (err) console.error(`Failed to delete cache file: ${err.message}`);
        });
    }
}

// API endpoint for PP calculation
fastify.post('/calculate', async (request, reply) => {
    try {
        let scoreParams;
        
        if (request.body.scoreId) {
            // If scoreId is provided, fetch score details
            try {
                scoreParams = await getScoreDetails(request.body.scoreId);
            } catch (error) {
                reply.status(400).send({ error: `Failed to fetch score details: ${error.message}` });
                return;
            }
        } else {
            // Use parameters directly from request body
            scoreParams = {
                beatmapId: request.body.beatmapId,
                mods: request.body.mods,
                accPercent: request.body.accPercent,
                combo: request.body.combo,
                nmiss: request.body.nmiss,
                sliderTailMiss: request.body.sliderTailMiss || 0,
                largeTickMiss: request.body.largeTickMiss || 0
            };
        }

        // Destructure the parameters for use in calculation
        const { beatmapId, mods, accPercent, combo, nmiss, sliderTailMiss, largeTickMiss } = scoreParams;

        const executablePath = path.join(__dirname, 'PerformanceCalculatorLinux', 'PerformanceCalculator');
        const modsExecArray = mods.flatMap((mod) => ['-m', mod.toUpperCase()]);
        const execArray = [
            'simulate', 'osu', beatmapId.toString(),
            '-a', accPercent.toString(),
            '-c', combo.toString(),
            '-X', nmiss.toString(),
            '-S', sliderTailMiss.toString(),
            '-L', largeTickMiss.toString(),
            ...modsExecArray,
            '-j',
        ];

        return new Promise((resolve, reject) => {
            execFile(executablePath, execArray, (error, stdout) => {
                if (error) {
                    reply.status(500).send({ error: error.message });
                    return;
                }

                try {
                    const lines = stdout.split('\n');
                    if (lines[0].includes('Downloading')) {
                        lines.shift();
                    }
                    stdout = lines.join('\n');
                    const jsonOutput = JSON.parse(stdout);

                    // Delete the cache file after parsing the output
                    deleteCacheFile(beatmapId);

                    if (jsonOutput?.performance_attributes?.pp) {
                        resolve({ pp: parseFloat(jsonOutput.performance_attributes.pp.toFixed(3)) });
                    } else {
                        reject(new Error("PP value not found in JSON output."));
                    }
                } catch (err) {
                    reply.status(500).send({ error: `Failed to parse JSON: ${err.message}` });
                }
            });
        });
    } catch (error) {
        reply.status(500).send({ error: `Unexpected error: ${error.message}` });
    }
});

// Start the server
fastify.listen({ port: 8080, host: '0.0.0.0' }, (err, address) => {
    if (err) throw err;
    fastify.log.info(`Performance Calculator API running at ${address}`);
});