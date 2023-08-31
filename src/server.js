const express = require("express");

const bodyParser = require("body-parser");
const users = require("./server/users");

const games = require("./server/games");
const app = express();

const cors = require("cors");
const { default: mongoose } = require("mongoose");

mongoose.connect("mongodb://localhost:27017/domino");
const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("connect"));
app.use(bodyParser.text());

app.use(
  cors({
    origin: ["http://localhost:5170", "http://localhost:5173"],
    credentials: true,
  })
);

app.use("/users", users);
app.use("/games", games);

app.listen(3000, console.log("Domino app listening on port 3000!"));
