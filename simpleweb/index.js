const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send("Hi mun");
});

app.listen(8080, () => {
    console.log("Listen on port 8080");
})