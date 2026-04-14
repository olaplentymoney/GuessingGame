const express = require("express");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./controllers/errorController");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  next();
});

//Serve frontend
app.use(express.static(path.join(__dirname, "../client")));

app.use(errorHandler);

module.exports = app;
