// fetch_user_scores.js
const fetchScoresFromEventSource = require('./event_source_fetcher');
const { writePlaysCSV, writeScoresCSV } = require('./csv-writer');

const SCORES_USER_FETCH_API = 'http://localhost:3000/fetch/user/scores';

async function fetchScores(username, limit) {
    const url = `${SCORES_USER_FETCH_API}/${username}/${Math.min(limit, 100)}`;
    return fetchScoresFromEventSource(url, `username ${username}`);
}

async function fetchScoresMultipleUsers(usernames, limit) {
    const promises = usernames.map(username => fetchScores(username, limit)
        .catch(error => {
            console.error(`Skipping user ${username} due to error:`, error.message);
            return []; // Return empty array if fetching fails for a user
        }).then(scores => scores.map(score => ({ username, ...score })))
    );

    await Promise.all(promises);
}

module.exports = { fetchScoresMultipleUsers };
