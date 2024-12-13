const mongoose = require('mongoose');


const playDataSchema = new mongoose.Schema({
    playId: { type: Number, required: true, unique: true },
    actualPP: { type: Number, required: true },
    accPercent: { type: Number, required: true },
    combo: { type: Number, required: true },
    nmiss: { type: Number, required: true },
    hitJudgement: { type: Number, required: true },
    approachRate: { type: Number, required: true },
    circleSize: { type: Number, required: true },
    circleCount: { type: Number, required: true },
    sliderCount: { type: Number, required: true },
    spinnerCount: { type: Number, required: true },
    largeTickHits: { type: Number, required: true },
    largeTickMisses: { type: Number, required: true },
    sliderTailHits: { type: Number, required: true },
    sliderTailMisses: { type: Number, required: true },
    bpm: { type: Number, required: true },
    hitLength: { type: Number, required: true },
    drainRate: { type: Number, required: true },
    rating: { type: Number, required: true },
    EZ: { type: Boolean, required: true },
    HT: { type: Boolean, required: true },
    HD: { type: Boolean, required: true },
    DT: { type: Boolean, required: true },
    NC: { type: Boolean, required: true },
    HR: { type: Boolean, required: true },
    FL: { type: Boolean, required: true },
    CL: { type: Boolean, required: true }
}, { collection: "training-data"});

const PlayData = mongoose.model('PlayData', playDataSchema);

module.exports = PlayData;