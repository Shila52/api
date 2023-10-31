const express = require("express");
const path = require('path');
const bodyParser = require("body-parser");
const users = require("./server/users");
const Admin = require("./server/AdminOrders");
const games = require("./server/games");
const app = express();

const cors = require("cors");
const { default: mongoose } = require("mongoose");

const connectionString =
  "mongodb+srv://jkhniujnhh:6ubJQi3hxrZtWrLZ@domino.gqfvez7.mongodb.net/domino?retryWrites=true&w=majority";

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("connect"));
app.use(bodyParser.text());

app.use(
  cors({
    origin: ["http://localhost:5170", "http://localhost:5173", "*"],
    credentials: true,
  })
);
// app.use(express.static(path.resolve(__dirname, "..", "public")));

app.use("/users", users);
app.use("/games", games);
app.use("/adminorders", Admin);

app.listen(3000, console.log("Domino app listening on port 3000!"));
