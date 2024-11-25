const axios = require('axios');
// to write the data to a json file
const fs = require('fs');

axios.get('http://localhost:3000/fetch/country/best/MG/2').then((response) => 
    {fs.writeFileSync(
        'data.json',
        JSON.stringify(response.data, null, 2),
        'utf-8'
    );

    }
)
.catch((error) => {console.log(error);});

async function scrapeData(countryCode, page) {
    try {
        const response = await axios.get(`http://localhost:3000/fetch/country/best/${countryCode}/${page}`);
        fs.writeFileSync(
            'data.json',
            JSON.stringify(response.data, null, 2),
            'utf-8'
        );
    } catch (error) {
        console.log(error);
    }
}