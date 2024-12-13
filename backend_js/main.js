const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const fetchRoutes = require('./routes/fetchRoutes');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(express.json({ limit: '1mb' })); 


// Use routes defined in the routes folder
app.use('/fetch', fetchRoutes);

app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("Connexion à MongoDB réussie !"))
.catch((error) => console.error("Erreur de connexion à MongoDB :", error));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
});

