const mongoose = require('mongoose');


const playDataSchema = new mongoose.Schema({
    playId: { type: Number, required: true, unique: true },
    actualPP: { type: Number, required: true },
    accPercent: { type: Number, required: true },
    combo: { type: Number, required: true },
    nmiss: { type: Number, required: true },
    hitJudgement: { type: Object, required: true },
    approachRate: { type: Number, required: true },
    circleSize: { type: Number, required: true },
    drainRate: { type: Number, required: true },
    rating: { type: Number, required: true },
    EZ: { type: Boolean, required: true },
    HT: { type: Boolean, required: true },
    HD: { type: Boolean, required: true },
    DT: { type: Boolean, required: true },
    NC: { type: Boolean, required: true },
    HR: { type: Boolean, required: true },
    FL: { type: Boolean, required: true },
}, { collection: "training-data"});

const PlayData = mongoose.model('PlayData', playDataSchema);

module.exports = PlayData;