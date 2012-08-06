/**
 * @fileOverview
 * Vows tests for starting up and shutting down a Thywill process with no
 * applications.
 */

var assert = require("assert");
var tools = require("./tools");

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuite("Startup and shutdown", tools.config);
// Add the final shutdown batches.
tools.finalizeVowsSuite(suite);

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;