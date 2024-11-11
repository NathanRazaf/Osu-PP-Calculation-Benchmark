// fetch_beatmap_scores.js
const fetchScoresFromEventSource = require('./event_source_fetcher');
const { writePlaysCSV, writeScoresCSV, writeBeatmapsCSV } = require('./csv-writer');


const SCORES_BEATMAP_FETCH_API = 'http://localhost:3000/fetch/beatmap/scores';

async function fetchScoresFromBeatmap(beatmapId, limit) {
    const url = `${SCORES_BEATMAP_FETCH_API}/${beatmapId}/${Math.min(limit, 50)}`;
    return fetchScoresFromEventSource(url, `beatmap ${beatmapId}`);
}

async function fetchScoresMultipleBeatmaps(beatmapIds, limit, playsCsvFile, scoresCsvFile, beatmapsCsvFile) {
    const promises = beatmapIds.map(beatmapId => fetchScoresFromBeatmap(beatmapId, limit)
        .catch(error => {
            console.error(`Skipping beatmap ${beatmapId} due to error:`, error.message);
            return []; // Return empty array if fetching fails for a beatmap
        })
    );

    const results = await Promise.all(promises);
    const allScores = results.flat();
    console.log(`Fetched ${allScores.length} scores for ${beatmapIds.length} beatmaps`);

    if (allScores.length > 0) {
        writePlaysCSV(allScores, playsCsvFile);
        writeScoresCSV(allScores, scoresCsvFile);
        writeBeatmapsCSV(allScores, beatmapsCsvFile);
        console.log('All data written to CSV files.');
    } else {
        console.log('No scores to write.');
    }
    return allScores;
}

module.exports = { fetchScoresMultipleBeatmaps };
