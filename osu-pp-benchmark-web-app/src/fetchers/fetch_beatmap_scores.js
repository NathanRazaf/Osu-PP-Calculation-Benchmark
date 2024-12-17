import { fetchScoresFromEventSource } from './event_source_fetcher';

// URL for the API that fetches beatmap scores
const SCORES_BEATMAP_FETCH_API = 'https://calc-osu-plays.onrender.com/fetch/beatmap/scores';

/**
 * Fetches beatmap scores using the EventSource.
 *
 * @param {string} beatmapId - The ID of the beatmap.
 * @param {number} limit - The maximum number of scores to fetch.
 * @param {function} [onProgress=null] - A callback function to handle progress updates.
 * @returns {Promise} - A promise that resolves with the fetched scores or rejects with an error.
 */
async function fetchBeatmapScores(beatmapId, limit, onProgress=null) {
    // Construct the URL with the beatmap ID and limit
    const url = `${SCORES_BEATMAP_FETCH_API}/${beatmapId}/${Math.min(limit, 50)}`;
    try {
        // Fetch scores using the EventSource
        const finalRes = await fetchScoresFromEventSource(url, `beatmap ${beatmapId}`, onProgress);

        // Return the fetched scores
        return finalRes;
    } catch (error) {
        console.error('Error fetching user scores:', error);
        // Rethrow the error to handle it elsewhere
        throw error;
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
