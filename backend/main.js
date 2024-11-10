const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const fetchRoutes = require('./routes/fetchRoutes');

const app = express();

app.use(express.json({ limit: '1mb' })); 


// Use routes defined in the routes folder
app.use('/fetch', fetchRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));