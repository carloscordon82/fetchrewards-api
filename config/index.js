const express = require("express");
const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost/module-2-project";

const favicon = require("serve-favicon");
const path = require("path");

module.exports = (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use(
    favicon(path.join(__dirname, "..", "public", "images", "favicon.ico"))
  );
};
