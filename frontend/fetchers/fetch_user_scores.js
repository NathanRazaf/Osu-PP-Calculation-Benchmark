// fetch_user_scores.js
const fetchScoresFromEventSource = require('./event_source_fetcher');
const { writePlaysCSV, writeScoresCSV, writeBeatmapsCSV } = require('./csv-writer');

const BEATMAPS_CSV_FILE = '../data_analysis/data/beatmaps.csv';
const PLAYS_CSV_FILE = '../data_analysis/data/plays.csv';
const SCORES_CSV_FILE = '../data_analysis/data/scores.csv';
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

    const results = await Promise.all(promises);
    const allScores = results.flat();
    console.log(`Fetched ${allScores.length} scores for ${usernames.length} users`);

    if (allScores.length > 0) {
        writePlaysCSV(allScores, PLAYS_CSV_FILE);
        writeScoresCSV(allScores, SCORES_CSV_FILE);
        writeBeatmapsCSV(allScores, BEATMAPS_CSV_FILE);
        console.log('All data written to CSV files.');
    } else {
        console.log('No scores to write.');
    }
    return allScores;
}

module.exports = { fetchScoresMultipleUsers };
