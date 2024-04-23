const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const corsOptions = {
  origin: "*",
};
app.use(cors(corsOptions));
const mongoose = require("mongoose");
const { MONGOURI } = require("./config/keys");

mongoose.connect(MONGOURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on("connected", () => {
  console.log("conneted to mongo yeahh");
});
mongoose.connection.on("error", (err) => {
  console.log("err connecting", err);
});

require("./models/user");
require("./models/post");

// health check
app.get("/healthz", (_, res) => {
  return res.json({ status: "ok" });
});

app.use(require("./routes/auth"));
app.use(require("./routes/user"));
app.use(require("./routes/post"));

app.use((err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err);
  res.status(500);
  res.json({ error: err.message });
});

app.use("*", (_, res) => {
  return res
    .status(404)
    .json({ error: "the requested resource does not exist on this server" });
});

module.exports = app;
