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
            modsExecArray.push(mod.toLowerCase());
        }

        const execArray = [
            'simulate', 'osu', beatmapId.toString(),
            '-a', accPercent.toString(),
            '-c', combo.toString(),
            '-X', nmiss.toString(), 
            ...modsExecArray
        ];

        execFile(executablePath, execArray, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                reject(error);
                return;
            }

            const output = stdout.toString();
            const ppLine = output.split('\n').find(line => line.includes('pp'));

            if (ppLine) {
                const ppValue = parseFloat(ppLine.split(':')[1].trim());
                console.log(`otpc: Executing: ${execArray.join(' ')}`);
                console.log(`PP: ${ppValue.toFixed(3)}`);
                deleteCacheFile(beatmapId);

                resolve(ppValue.toFixed(3));
            } else {
                console.log("PP value not found in output.");
                reject(new Error("PP value not found in output."));
            }
        });
    });
}

module.exports = { otpcCalculatePP };
