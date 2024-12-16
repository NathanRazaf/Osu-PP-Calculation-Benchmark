const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ErrorStats Schema
const ErrorStatsSchema = new Schema({
    minPp: {
        type: Number,
        required: true
    },
    maxPp: {
        type: Number,
        required: true
    },
    mae: {
        type: [Number],
        required: true
    },
    rmse: {
        type: [Number],
        required: true
    },
    mbe: {
        type: [Number],
        required: true
    },
    dataSize: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    collection: 'errorStats'
});

// Create compound unique index
ErrorStatsSchema.index({ minPp: 1, maxPp: 1 }, { unique: true });

// Outlier Schema (for embedded documents)
const OutlierSchema = new Schema({
    model: {
        type: String,
        required: true
    },
    actualPP: {
        type: Number,
        required: true
    },
    error: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    }
}, { _id: false }); 

// OutlierDistributionGraph Schema
const OutlierDistributionGraphSchema = new Schema({
    minPp: {
        type: Number,
        required: true
    },
    maxPp: {
        type: Number,
        required: true
    },
    errorThreshold: {
        type: Number,
        required: true
    },
    top200best: {
        type: [OutlierSchema],
        default: []
    },
    top200worst: {
        type: [OutlierSchema],
        default: []
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    collection: 'outlierStats'
});

// Create compound index
OutlierDistributionGraphSchema.index({ minPp: 1, maxPp: 1, errorThreshold: 1 });

// Add the outlier method as an instance method
OutlierDistributionGraphSchema.methods.addOutlier = function(newOutlier) {
    // Add to top200worst if array is not full or new outlier has higher error
    if (this.top200worst.length < 200 || newOutlier.error > this.top200worst[this.top200worst.length - 1].error) {
        this.top200worst.push(newOutlier);
        this.top200worst.sort((a, b) => b.error - a.error); // Sort by descending error
        if (this.top200worst.length > 200) {
            this.top200worst = this.top200worst.slice(0, 200);
        }
    }

    // Add to top200best if array is not full or new outlier has lower error
    if (this.top200best.length < 200 || newOutlier.error < this.top200best[this.top200best.length - 1].error) {
        this.top200best.push(newOutlier);
        this.top200best.sort((a, b) => a.error - b.error); // Sort by ascending error
        if (this.top200best.length > 200) {
            this.top200best = this.top200best.slice(0, 200);
        }
    }
};

// Create models
const ErrorStatsModel = mongoose.model('ErrorStats', ErrorStatsSchema);
const OutlierDistributionGraphModel = mongoose.model('OutlierDistributionGraph', OutlierDistributionGraphSchema);

module.exports = {
    ErrorStatsModel,
    OutlierDistributionGraphModel
};