const { ErrorStatsModel, OutlierDistributionGraphModel } = require('../mongo_models/statsModels.js');

async function updateStatsOnAllRanges(newDoc) {
    const actualPP = newDoc.actualPP;

    // Get the 200-sized bucket in which the actual PP falls
    let minPP = Math.floor(actualPP / 200) * 200;
    let maxPP = minPP + 200;

    // If the actual PP is greater or equal than 1000, set the minPP to 1000 and maxPP to 100000
    if (minPP >= 1000) {
        minPP = 1000;
        maxPP = 100000;
    }

    const finalRanges = [[minPP, maxPP], [0, 100000]];  // For the actual PP and the entire range
    const thresholds = Array.from({length: 4}, (_, i) => (i + 1) * 200);  // From 200 to 800

    // we'll use Promise.all for concurrent operations
    const errorPromises = finalRanges.map(([min, max]) => 
        updateErrorStatsBulk(newDoc, min, max)
    );

    const outlierPromises = finalRanges.flatMap(([min, max]) =>
        thresholds.map(threshold => 
            updateOutlierStatsBulk(newDoc, min, max, threshold)
        )
    );

    // Wait for all operations to complete
    const [errorUpdates, outlierUpdates] = await Promise.all([
        Promise.all(errorPromises),
        Promise.all(outlierPromises)
    ]);

    // Perform bulk operations
    if (errorUpdates.length) {
        await ErrorStatsModel.bulkWrite(errorUpdates);
    }
    if (outlierUpdates.length) {
        await OutlierDistributionGraphModel.bulkWrite(outlierUpdates);
    }
}

async function updateErrorStatsBulk(newDoc, minPP, maxPP) {
    const actualPP = newDoc.actualPP;
    const calculators = ['ojsamaPP', 'rosuPP', 'otpcPP'];

    // Attempt to find the document
    const errorStat = await ErrorStatsModel.findOne({ minPp: minPP, maxPp: maxPP });

    if (!errorStat) {
        // New document logic
        const mae = calculators.map(calc => Math.abs(actualPP - newDoc[calc]));
        const rmse = calculators.map(calc => Math.abs(actualPP - newDoc[calc]));
        const mbe = calculators.map(calc => actualPP - newDoc[calc]);

        return {
            updateOne: {
                filter: { minPp: minPP, maxPp: maxPP },
                update: {
                    $setOnInsert: {
                        minPp: minPP,
                        maxPp: maxPP,
                        createdAt: new Date(),
                        dataSize: 1,
                        mae,
                        rmse,
                        mbe
                    }
                },
                upsert: true
            }
        };
    } else {
        // Existing document logic
        const dataSize = errorStat.dataSize;
        const currentMae = errorStat.mae;
        const currentRmse = errorStat.rmse;
        const currentMbe = errorStat.mbe;

        const newMae = calculators.map((calc, i) => 
            (currentMae[i] * dataSize + Math.abs(actualPP - newDoc[calc])) / (dataSize + 1)
        );

        const newRmse = calculators.map((calc, i) => 
            Math.sqrt(((currentRmse[i] ** 2) * dataSize + (actualPP - newDoc[calc]) ** 2) / (dataSize + 1))
        );

        const newMbe = calculators.map((calc, i) => 
            (currentMbe[i] * dataSize + (actualPP - newDoc[calc])) / (dataSize + 1)
        );

        return {
            updateOne: {
                filter: { minPp: minPP, maxPp: maxPP },
                update: {
                    $set: {
                        createdAt: new Date(),
                        mae: newMae,
                        rmse: newRmse,
                        mbe: newMbe
                    },
                    $inc: { dataSize: 1 }
                }
            }
        };
    }
}

async function updateOutlierStatsBulk(newDoc, minPP, maxPP, errThreshold) {
    const actualPP = newDoc.actualPP;

    // Calculate errors for each calculator
    const errors = {
        ojsamaPP: Math.abs(actualPP - newDoc.ojsamaPP),
        rosuPP: Math.abs(actualPP - newDoc.rosuPP),
        otpcPP: Math.abs(actualPP - newDoc.otpcPP)
    };

    // Prepare outliers for each calculator exceeding the error threshold
    const newOutliers = Object.entries(errors)
        .filter(([, error]) => error > errThreshold)
        .map(([model, error]) => ({
            model,
            actualPP,
            error,
            createdAt: new Date()
        }));

    const existingDoc = await OutlierDistributionGraphModel.countDocuments({
        minPp: minPP,
        maxPp: maxPP,
        errorThreshold: errThreshold
    });

    if (existingDoc === 0) {
        return {
            updateOne: {
                filter: { minPp: minPP, maxPp: maxPP, errorThreshold: errThreshold },
                update: {
                    $setOnInsert: {
                        minPp: minPP,
                        maxPp: maxPP,
                        errorThreshold: errThreshold,
                        createdAt: new Date(),
                        top200best: newOutliers,
                        top200worst: newOutliers
                    }
                },
                upsert: true
            }
        };
    }

    return {
        updateOne: {
            filter: { minPp: minPP, maxPp: maxPP, errorThreshold: errThreshold },
            update: {
                $push: {
                    top200best: {
                        $each: newOutliers,
                        $slice: 200,
                        $sort: { error: 1 }
                    },
                    top200worst: {
                        $each: newOutliers,
                        $slice: 200,
                        $sort: { error: -1 }
                    }
                }
            }
        }
    };
}

module.exports = {
    updateStatsOnAllRanges,
    updateErrorStatsBulk,
    updateOutlierStatsBulk
};