// fetchScoresFromEventSource.js

/**
 * Fetches scores from a server-sent events (SSE) source.
 *
 * @param {string} url - The URL of the EventSource.
 * @param {string} progressLabel - A label to identify the progress.
 * @param {function} [onProgress=null] - A callback function to handle progress updates.
 * @returns {Promise} - A promise that resolves with the final result or rejects with an error.
 */
export function fetchScoresFromEventSource(url, progressLabel, onProgress = null) {
    return new Promise((resolve, reject) => {
        console.log(`Fetching scores with ${progressLabel}. It may take a while...`);

        // Create a new EventSource instance to listen for server-sent events (SSE)
        const eventSource = new EventSource(url);
        let finalResult = null;

        // Event handler for incoming messages from the EventSource
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // Check if the message contains progress information
            if (data.progress) {
                console.log(`Progress for ${progressLabel}: ${data.progress}%`);
                if (onProgress) {
                    // Call the progress callback function if provided
                    onProgress(data.progress);
                }
            }

            // Check if the message indicates that processing is finished
            if (data.message === "Finished processing") {
                console.log(`Finished processing for ${progressLabel}.`);
                finalResult = data.results;
                // Resolve the promise with the final result
                resolve(finalResult);
                // Close the EventSource connection
                eventSource.close();
            }
        };

        // Event handler for errors from the EventSource
        eventSource.onerror = (error) => {
            console.error(`Error fetching scores for ${progressLabel}:`, error);
            // Close the EventSource connection
            eventSource.close();
            // Reject the promise with the error
            reject(error);
        };
    });
}