#!/usr/bin/env node

/**
 * @fileOverview
 * Tell a Thywill server to gracefully prepare for shutdown.
 */

var Thywill = require("thywill");

//Load the Thywill core configuration and start the shutdown process.
var thywillConfig = require("./thywillConfig");
Thywill.prepareForShutdown(thywillConfig);