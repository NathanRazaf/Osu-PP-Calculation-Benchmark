// fetch_beatmap_scores.js
import { fetchScoresFromEventSource } from './event_source_fetcher';

const SCORES_BEATMAP_FETCH_API = 'http://localhost:3000/fetch/beatmap/scores';

async function fetchBeatmapScores(beatmapId, limit, onProgress=null) {
    const url = `${SCORES_BEATMAP_FETCH_API}/${beatmapId}/${Math.min(limit, 50)}`;
    try {
        const finalRes = await fetchScoresFromEventSource(url, `beatmap ${beatmapId}`, onProgress);

        return finalRes; // Return the array to use elsewhere
    } catch (error) {
        console.error('Error fetching user scores:', error);
        throw error; // Rethrow error
    }
}

async function fetchScoresMultipleBeatmaps(beatmapIds, limit, onProgress=null) {
    const promises = beatmapIds.map(beatmapId => fetchBeatmapScores(beatmapId, limit, onProgress)
        .catch(error => {
            console.error(`Skipping beatmap ${beatmapId} due to error:`, error.message);
            return []; // Return empty array if fetching fails for a beatmap
        })
    );
    await Promise.all(promises);
}

export{ fetchBeatmapScores, fetchScoresMultipleBeatmaps };
