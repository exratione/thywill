/**
 * @fileOverview
 * Various utility functions for testing.
 */

var vows = require("vows");
var assert = require("assert");
var http = require("http");
var baseConfig = require("./baseTestThywillConfig");
var Thywill = require("thywill");

var tools = {
  // Populated with a Thywill instance by the thywillVowsSuite.
  thywill: null,
  // Base configuration.
  config: baseConfig,

  /**
   * Create a partially formed Vows suite that launches a Thywill instance as
   * its first batch.
   *
   * @param {Object} config
   *   Thywill configuration.
   * @param {Application|Applications[]} [applications]
   *   Optional applications.
   * @return {Object}
   *   A Vows suite with a batch added to launch a Thywill server.
   */
  createVowsSuite: function (name, config, applications) {
    var self = this;
    if (!applications) {
      applications = [];
    }

    // Set up the test suite and return it.
    var suite = vows.describe(name);
    suite.addBatch({
      "set up Thywill": {
        topic: function () {
          // Launch Thywill with no applications and using only http.Server
          // rather than Express.
          //
          // Use a port that won't conflict with any of the example
          // applications.
          var server = http.createServer().listen(10079);
          config.clientInterface.server.server = server;

          Thywill.launch(self.config, applications, this.callback);
        },
        "successful launch": function (error, thywill, server) {
          self.thywill = thywill;
          assert.isTrue(self.thywill instanceof Thywill);
          assert.isNull(error);
        }
      }
    });
    return suite;
  }
};

//-----------------------------------------------------------
// Exports - Tools object
//-----------------------------------------------------------

module.exports = tools;
