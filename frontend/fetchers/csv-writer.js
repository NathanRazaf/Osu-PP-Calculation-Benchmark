const fs = require('fs');

function csvMaker(data) {
    if (!data.length) return '';
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));

    data.forEach(row => {
        const values = headers.map(header => row[header] ?? ''); // Handle missing values
        csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
}



function writePlaysCSV(jsonData, filePath) {
    const possibleMods = ['EZ', 'HT', 'HD', 'NC', 'DT', 'HR', 'FL'];

    const playData = jsonData.map(item => {
        const { beatmap, playId, actualPP } = item;
        const { mods = [], id, beatmapId, score, ...beatmapWithoutMods } = beatmap; // Default `mods` to empty array

        // Create mod flags for each possible mod
        const modFlags = {};
        possibleMods.forEach(mod => {
            modFlags[mod] = mods.includes(mod) ? 1 : 0;
        });

        return {
            playId, 
            actualPP,
            ...beatmapWithoutMods,
            ...modFlags,
        };
    });

    const csvContent = csvMaker(playData);
    fs.writeFileSync(filePath, csvContent, 'utf8');
}

function writeScoresCSV(jsonData, filePath) {
    const scoreData = jsonData.map(item => {
        const { username, beatmap, ...scores } = item;
        const { beatmapId, score } = beatmap;
        return { beatmapId, username, score, ...scores };
    });

    const csvContent = csvMaker(scoreData);
    fs.writeFileSync(filePath, csvContent, 'utf8');
}

module.exports = {
    writePlaysCSV,
    writeScoresCSV,
};
