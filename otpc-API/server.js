const fastify = require('fastify')({ logger: true });
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

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
    const { beatmapId, mods, accPercent, combo, nmiss } = request.body;

    const executablePath = path.join(__dirname, 'PerformanceCalculatorLinux', 'PerformanceCalculator');
    const modsExecArray = mods.flatMap((mod) => ['-m', mod.toUpperCase()]);
    const execArray = [
        'simulate', 'osu', beatmapId.toString(),
        '-a', accPercent.toString(),
        '-c', combo.toString(),
        '-X', nmiss.toString(),
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
});

// Start the server
fastify.listen({ port: 8080, host: '0.0.0.0' }, (err, address) => {
    if (err) throw err;
    fastify.log.info(`Performance Calculator API running at ${address}`);
});
