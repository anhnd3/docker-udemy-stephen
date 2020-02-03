const keys = require("./keys");

// express app setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client setup
const { Pool } = require("pg");
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabases,
    password: keys.pgPassword,
    port: keys.pgHost
});
pgClient.on("error", () => { console.log("Lost PG connection") });

pgClient
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch(error => { console.log(error) })

// Redis setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// Express router handler
app.get("/", (req, resp) => {
    resp.send("hi")
});

app.get("/values/all", async (req, resp) => {
    const values = await pgClient.query("SELECT * from values");
    resp.send(values.rows);
});

app.get("/values/current", async (req, resp) => {
    redisClient.hgetall("values", (err, values) => {
        resp.send(values)
    });
});

app.post("/values", async (req, resp) => {
    const index = req.body.index;

    if (parseInt(index) > 40) {
        return resp.status(422).send("index too high");
    }

    redisClient.hset("values", index, "Nothing yet!");
    redisPublisher.publist("insert", index);
    pgClient.query("INSERT INTO values(number) VALUES ($1)", [index])

    resp.send({ working: true });
});

app.listen(5000, err => { console.log("Listening") })