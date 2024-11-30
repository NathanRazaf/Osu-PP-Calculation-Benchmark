// fetch_user_scores.js
import { fetchScoresFromEventSource } from './event_source_fetcher';

const SCORES_USER_FETCH_API = 'http://localhost:3000/fetch/user/scores';

async function fetchUserScores(username, limit, onProgress=null) {
    const url = `${SCORES_USER_FETCH_API}/${username}/${Math.min(limit, 100)}`;
    try {
        const finalRes = await fetchScoresFromEventSource(url, `user ${username}`, onProgress);

        return finalRes; // Return the array to use elsewhere
    } catch (error) {
        console.error('Error fetching user scores:', error);
        throw error; // Rethrow error if necessary
    }
}

async function fetchScoresMultipleUsers(usernames, limit, onProgress=null) {
    const promises = usernames.map(username => fetchUserScores(username, limit, onProgress)
        .catch(error => {
            console.error(`Skipping user ${username} due to error:`, error.message);
            return []; // Return empty array if fetching fails for a user
        }).then(scores => scores.map(score => ({ username, ...score })))
    );

    await Promise.all(promises);
}

export { fetchUserScores, fetchScoresMultipleUsers };
