const { fetchScoresMultipleBeatmaps } = require('./fetchers/fetch_beatmap_scores');
const { fetchScoresMultipleUsers } = require('./fetchers/fetch_user_scores');


const PLAYS_CSV_FILE = '../backend_python/data/training_data.csv';
const SCORES_CSV_FILE = '../backend_python/data/scores.csv';

fetchScoresMultipleBeatmaps([2245774], 5, PLAYS_CSV_FILE, SCORES_CSV_FILE);
// TODO