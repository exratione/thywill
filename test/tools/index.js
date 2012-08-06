/**
 * @fileOverview
 * Various utility functions for testing.
 */

var vows = require('vows');
var assert = require('assert');
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
          // Launch Thywill with no applications.
          Thywill.launch(config, applications, null, this.callback);  
        },
        "successful launch": function(error, thywill, server) {
          self.thywill = thywill;
          assert.isNull(error);
        }
      }
    });
    return suite;
  },
  
  
  /**
   * Add batches to a Thywill test suite that shut down the servers, so as to
   * free up the port for the next test.
   * 
   * @param {Object} suite
   *   A Vows suite originally obtained via tools.vowsSuite().
   */
  finalizeVowsSuite: function(suite) {
    var self = this;
    suite.addBatch({
      "shutdown preparation": {
        topic: function () {
          Thywill.prepareForShutdown(self.thywill.config, this.callback);
        },
        "successful preparation for shutdown": function (error) {
          // Strangely the null passed into the callback as thywill.NO_ERRORS
          // shows up here as undefined - not expected.
          assert.isTrue(error == undefined || error == null);
        }
      }
    });
    // self.thywill.server will have been closed during preparation for shutdown,
    // since we didn't provide a server. But we still have to close the admin
    // interface.
    suite.addBatch({
      "close admin interface server": {
        topic: function () {
          self.thywill.adminInterfaceServer.on("close", this.callback);
          self.thywill.adminInterfaceServer.close();
        },
        "server closed without error": function (error) {
          assert.isUndefined(error);
        }
      }
    });
  }
};

//-----------------------------------------------------------
// Exports - Tools object
//-----------------------------------------------------------

module.exports = tools;
