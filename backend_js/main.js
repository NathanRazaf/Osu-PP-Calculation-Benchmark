const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const fetchRoutes = require('./routes/fetchRoutes');
const { connectRedis, disconnectRedis } = require('./redisClient');

const app = express();

app.use(express.json({ limit: '1mb' })); 


// Use routes defined in the routes folder
app.use('/fetch', fetchRoutes);

(async () => {
    await connectRedis(); // Connect to Redis before starting the server

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log('Server running on http://localhost:' + PORT);
    });
})();

process.on('SIGINT', async () => {
    await disconnectRedis(); // Gracefully disconnect Redis on shutdown
    process.exit();
});