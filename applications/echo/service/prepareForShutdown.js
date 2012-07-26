#!/usr/bin/env node

/**
 * @fileOverview
 * Tell a Thywill server to gracefully prepare for shutdown.
 */

var Thywill = require("thywill");
var fs = require("fs");
var path = require("path");

var filepath = path.resolve(__dirname, "./thywillConfig.json");
var config = JSON.parse(fs.readFileSync(filepath, "utf-8"));

Thywill.prepareForShutdown(config);