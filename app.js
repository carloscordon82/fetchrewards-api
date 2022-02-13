require("dotenv/config");
require("./db");
const express = require("express");
const app = express();
require("./config")(app);

const index = require("./routes/index");
const api = require("./routes/api.routes");

app.use("/", index);
app.use("/api", api);

require("./error-handling")(app);

module.exports = app;
