const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// Helper function to delete cached beatmap file
async function deleteCacheFile(beatmapId) {
    const cacheFilePath = path.join(__dirname, '../cache', `${beatmapId}.osu`);
    if (fs.existsSync(cacheFilePath)) {
        fs.unlinkSync(cacheFilePath, (err) => {
            if (err) console.error(`Failed to delete cache file: ${err.message}`);
        });
    }
}

// Main PP calculation function with caching
async function otpcCalculatePP(beatmapId, mods = [], accPercent = 100, combo = null, nmiss = 0) {
    return new Promise((resolve, reject) => {
        // Path to the Linux executable
        const executablePath = path.join(__dirname, 'PerformanceCalculatorLinux', 'PerformanceCalculator');

        // Ensure the executable exists
        if (!fs.existsSync(executablePath)) {
            reject(new Error(`Executable not found at ${executablePath}`));
            return;
        }

        // Build the command array
        const modsExecArray = mods.flatMap((mod) => ['-m', mod.toUpperCase()]);
        const execArray = [
            'simulate', 'osu', beatmapId.toString(),
            '-a', accPercent.toString(),
            '-c', combo.toString(),
            '-X', nmiss.toString(),
            ...modsExecArray,
            '-j', // Output JSON
        ];

        // Execute the PerformanceCalculator
        execFile(executablePath, execArray, (error, stdout) => {
            if (error) {
                reject(error);
                return;
            }

            try {
                const lines = stdout.split('\n');
                if (lines[0].includes('Downloading')) {
                    lines.shift();
                }
                stdout = lines.join('\n');
                const jsonOutput = JSON.parse(stdout); // Parse JSON from stdout
                deleteCacheFile(beatmapId); // Delete cached beatmap file
                if (jsonOutput?.performance_attributes?.pp) {
                    console.log(`Executing PerformanceCalculator with beatmapId: ${beatmapId}, mods: ${mods}, acc: ${accPercent}, combo: ${combo}, nmiss: ${nmiss}`);
                    console.log(`PP: ${parseFloat(jsonOutput.performance_attributes.pp.toFixed(3))}`);
                    resolve(parseFloat(jsonOutput.performance_attributes.pp.toFixed(3)));
                } else {
                    reject(new Error("PP value not found in JSON output."));
                }
            } catch (err) {
                reject(new Error(`Failed to parse JSON output: ${err.message}`));
            }
        });
    });
}

module.exports = { otpcCalculatePP };
