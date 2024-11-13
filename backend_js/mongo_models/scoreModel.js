const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    playId: { type: Number, required: true, unique: true },
    beatmapId: { type: Number, required: true },
    username: { type: String, required: true },
    score: { type: Number, required: true },
    ojsamaPP: { type: Number, required: true },
    rosuPP: { type: Number, required: true },
    otpcPP: { type: Number, required: true },
    actualPP: { type: Number, required: true },
});

scoreSchema.index({ beatmapId: 1 });
scoreSchema.index({ username: 1 });

const Score = mongoose.model('Score', scoreSchema);

module.exports = Score;
