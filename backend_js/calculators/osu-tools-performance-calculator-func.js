const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const Score = require('../mongo_models/scoreModel');


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
        let executablePath;

        switch (process.platform) {
            case 'linux':
                executablePath = path.join(__dirname, 'PerformanceCalculators/PerformanceCalculatorLinux', 'PerformanceCalculator');
                break;
            case 'win32':
                executablePath = path.join(__dirname, 'PerformanceCalculators/PerformanceCalculatorWindows', 'PerformanceCalculator.exe');
                break;
            case 'darwin':
                executablePath = path.join(__dirname, 'PerformanceCalculators/PerformanceCalculatorMac', 'PerformanceCalculator');
                break;
            default:
                console.error('Unsupported OS');
                reject(new Error('Unsupported OS'));
                return;
        }

        let modsExecArray = [];
        for (let mod of mods) {
            modsExecArray.push(`-m`);
            modsExecArray.push(mod.toUpperCase());
        }

        const execArray = [
            'simulate', 'osu', beatmapId.toString(),
            '-a', accPercent.toString(),
            '-c', combo.toString(),
            '-X', nmiss.toString(), 
            ...modsExecArray,
            '-j'
        ];

        execFile(executablePath, execArray, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                reject(error);
                return;
            }

            
            try {
                // Take stdout and remove the first line if it contains "Downloading"
                const lines = stdout.split('\n');
                if (lines[0].includes('Downloading')) {
                    lines.shift();
                }
                stdout = lines.join('\n');
                const jsonOutput = JSON.parse(stdout); // Parse JSON from stdout
                if (jsonOutput?.performance_attributes?.pp) {
                    resolve(jsonOutput.performance_attributes.pp);
                } else {
                    reject(new Error("PP value not found in JSON output."));
                }
            } catch (err) {
                console.error("Failed to parse JSON output:", err.message);
                reject(err);
            }
        });
    });
}

module.exports = { otpcCalculatePP };
