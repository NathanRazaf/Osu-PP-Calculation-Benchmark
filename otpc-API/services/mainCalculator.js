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
                
                const stats = jsonOutput.score.statistics;
                const grade = calculateGrade(stats, mods);

                if (jsonOutput?.performance_attributes?.pp) {
                    resolve({ pp: parseFloat(jsonOutput.performance_attributes.pp.toFixed(3)), grade });
                } else {
                    reject(new Error("PP value not found in JSON output."));
                }
            } catch (err) {
                reject(new Error(`Failed to parse JSON: ${err.message}`));
            }
        });
    });
}

function calculateGrade(stats, mods) {
    const totalHits = stats.great + stats.ok + stats.meh + stats.miss;
    // Perfect score
    if (stats.great === totalHits) {
        // SSH if HD or FL is enabled
        if (mods.includes('HD') || mods.includes('FL')) {
            return 'SSH';
        } else {
            // SS otherwise
            return 'SS';
        }
    }

    const proportion300s = stats.great / totalHits;
    const proportion50s = stats.meh / totalHits;

    // Over 90% 300s, at most 1% 50s, and no misses
    if (proportion300s > 0.9 && proportion50s <= 0.01 && stats.miss === 0) {
        // SH if HD or FL is enabled
        if (mods.includes('HD') || mods.includes('FL')) {
            return 'SH';
        } else {
            // S otherwise
            return 'S';
        }
    }

    // A if over 80% 300s and no misses OR over 90% 300s
    if (proportion300s > 0.8 && stats.miss === 0 || proportion300s > 0.9) {
        return 'A';
    }

    // B if over 70% 300s and no misses OR over 80% 300s
    if (proportion300s > 0.7 && stats.miss === 0 || proportion300s > 0.8) {
        return 'B';
    }

    // C if over 60% 300s
    if (proportion300s > 0.6) {
        return 'C';
    }

    // Anything else is a D
    return 'D';
}

module.exports = { calculatePerformance };