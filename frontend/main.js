const axios = require('axios');
const EventSource = require('eventsource');
const args = process.argv.slice(2);
const username = args[0];
const limit = args[1] || 10;

if (!username) {
    console.log("Usage: node cli.js <username> <limit>");
    process.exit(1);
}

async function fetchScores(username, limit) {
    try {   
        limit = Math.min(limit, 100); // Ensure limit is capped at 100
        console.log(`Fetching scores for ${username} with limit ${limit}. It may take a while...`);

        // Open an EventSource to receive progress updates from the server
        const eventSource = new EventSource(`http://localhost:3000/fetch/scores/${username}/${limit}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // Handle progress updates
            if (data.progress) {
                console.log(`Progress: ${data.progress}%`);
            }

            // When processing is finished, close the connection
            if (data.message === "Finished processing") {
                console.log("Finished processing.");
                // Write the final results to a file
                const fs = require('fs');
                fs.writeFileSync('scores.json', JSON.stringify(data.results, null, 2));
                eventSource.close(); // Close the connection
            }
        };

        eventSource.onerror = (error) => {
            console.error("Error receiving progress updates:", error);
            eventSource.close();
        };

    } catch (error) {
        console.error(error.message);
    }
}

fetchScores(username, limit);
