const axios = require('axios');
// to write the data to a json file
const fs = require('fs');

axios.get('http://localhost:3000/fetch/user/scores/NathanRazaf/10').then((response) => 
    {console.log(response);

    }
)
.catch((error) => {console.log(error);});

