const path = require("path");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const users = require("./server/users");
const auth = require("./server/auth");
const games = require("./server/games");
const app = express();
const cors = require('cors'); 
app.use(cors({
    origin: 'http://127.0.0.1:5173', // Replace with your React app's origin
    credentials: true, // Allow cookies and other credentials to be sent
  }));
  
app.use(
  session({
    secret: "keyboard cat",
    resave: false, 
    saveUninitialized: true,
    cookie: { maxAge: 269999999999 },
  })
);
app.use(bodyParser.text());
app.use("/users", users);
app.use("/games", games);

app.listen(3000, console.log("Domino app listening on port 3000!"));
