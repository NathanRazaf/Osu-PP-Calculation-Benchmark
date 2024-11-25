const mongoose = require('mongoose');

// Define the schema
const userScoresSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    scores: [
        {
            playId: { type: Number, required: true, unique: true },
            beatmapId: { type: Number, required: true },
            score: { type: Number, required: true },
            ojsamaPP: { type: Number, required: true },
            rosuPP: { type: Number, required: true },
            otpcPP: { type: Number, required: true },
            actualPP: { type: Number, required: true },
        }
    ]
});

// Helper function to sort and cap the scores array
userScoresSchema.methods.sortAndCapScores = function () {
    // Sort scores by actualPP in descending order
    this.scores.sort((a, b) => b.actualPP - a.actualPP);
    
    // Trim the scores array to a maximum of 200 entries
    if (this.scores.length > 200) {
        this.scores = this.scores.slice(0, 200);
    }
};

// Add a method to add a score while enforcing sorting and capping
userScoresSchema.methods.addScore = async function (newScore) {
    // Push the new score to the array
    this.scores.push(newScore);

    // Sort and cap the array
    this.sortAndCapScores();

    // Save the document
    return this.save();
};

// Pre-save hook to ensure scores are sorted and capped before saving
userScoresSchema.pre('save', function (next) {
    this.sortAndCapScores();
    next();
});

const UserScores = mongoose.model('UserScores', userScoresSchema);

module.exports = UserScores;