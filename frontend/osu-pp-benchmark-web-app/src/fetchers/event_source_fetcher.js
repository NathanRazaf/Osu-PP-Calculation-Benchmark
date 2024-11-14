// fetchScoresFromEventSource.js

export function fetchScoresFromEventSource(url, progressLabel, onProgress = null) {
    return new Promise((resolve, reject) => {
        console.log(`Fetching scores with ${progressLabel}. It may take a while...`);

        // Use the native EventSource API in the browser
        const eventSource = new EventSource(url);
        let finalResult = null;

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.progress) {
                console.log(`Progress for ${progressLabel}: ${data.progress}%`);
                if (onProgress) {
                    onProgress(data.progress);
                }
            }
            if (data.message === "Finished processing") {
                console.log(`Finished processing for ${progressLabel}.`);
                finalResult = data.results;
                resolve(finalResult);
                eventSource.close();
            }
        };

        eventSource.onerror = (error) => {
            console.error(`Error fetching scores for ${progressLabel}:`, error);
            eventSource.close();
            reject(error);
        };
    });
}
