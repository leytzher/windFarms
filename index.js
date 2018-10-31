const express = require('express');

app = express();

server = app.listen(4000, ()=>{
    console.log("App running on port 4000...");
});


app.use(express.static('static'));