// fetch_beatmap_scores.js
const fetchScoresFromEventSource = require('./event_source_fetcher');
const { writePlaysCSV, writeScoresCSV } = require('./csv-writer');

const SCORES_BEATMAP_FETCH_API = 'http://localhost:3000/fetch/beatmap/scores';

async function fetchScoresFromBeatmap(beatmapId, limit) {
    const url = `${SCORES_BEATMAP_FETCH_API}/${beatmapId}/${Math.min(limit, 50)}`;
    return fetchScoresFromEventSource(url, `beatmap ${beatmapId}`);
}

async function fetchScoresMultipleBeatmaps(beatmapIds, limit) {
    const promises = beatmapIds.map(beatmapId => fetchScoresFromBeatmap(beatmapId, limit)
        .catch(error => {
            console.error(`Skipping beatmap ${beatmapId} due to error:`, error.message);
            return []; // Return empty array if fetching fails for a beatmap
        })
    );
    await Promise.all(promises);
}

module.exports = { fetchScoresMultipleBeatmaps };
