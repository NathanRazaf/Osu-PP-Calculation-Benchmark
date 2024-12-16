const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

async function deleteCacheFile(beatmapId, dir) {
    const cacheFilePath = path.join(dir, './cache', `${beatmapId}.osu`);
    console.log(`Deleting cache file: ${cacheFilePath}`);
    if (fs.existsSync(cacheFilePath)) {
        fs.unlinkSync(cacheFilePath, (err) => {
            if (err) console.error(`Failed to delete cache file: ${err.message}`);
        });
    }
}

async function calculatePerformance(scoreParams, dir) {
    const { beatmapId, mods, accPercent, combo, nmiss, sliderTailMiss, largeTickMiss, n50, n100 } = scoreParams;

    const executablePath = path.join(dir, 'PerformanceCalculatorLinux', 'PerformanceCalculator');
    const modsExecArray = mods.flatMap((mod) => ['-m', mod.toUpperCase()]);
    
    // Start with the required parameters
    let execArray = [
        'simulate', 'osu', beatmapId.toString(),
        '-c', combo.toString(),
        '-X', nmiss.toString(),
        '-S', sliderTailMiss.toString(),
        '-L', largeTickMiss.toString(),
    ];

    // Add accuracy parameter if provided
    if (accPercent !== undefined) {
        execArray.push('-a', accPercent.toString());
    }

    // Add n50 parameter if provided
    if (n50 !== undefined) {
        execArray.push('-M', n50.toString());
    } 

    // Add n100 parameter if provided
    if (n100 !== undefined) {
        execArray.push('-G', n100.toString());
    }

    // Add the mods and json flag
    execArray = [...execArray, ...modsExecArray, '-j'];

    return new Promise((resolve, reject) => {
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
                const jsonOutput = JSON.parse(stdout);

                // Delete the cache file after parsing the output
                deleteCacheFile(beatmapId, dir);

                if (jsonOutput?.performance_attributes?.pp) {
                    resolve({ pp: parseFloat(jsonOutput.performance_attributes.pp.toFixed(3)) });
                } else {
                    reject(new Error("PP value not found in JSON output."));
                }
            } catch (err) {
                reject(new Error(`Failed to parse JSON: ${err.message}`));
            }
        });
    });
}

module.exports = { calculatePerformance };