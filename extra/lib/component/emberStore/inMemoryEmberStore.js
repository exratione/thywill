/**
 * @fileOverview
 * InMemoryEmberStore class definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * An EmberStore class to hold data in memory only.
 */
function InMemoryEmberStore() {
  InMemoryEmberStore.super_.call(this);
}
util.inherits(InMemoryEmberStore, Thywill.getBaseClass("EmberStore"));
var p = InMemoryEmberStore.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

InMemoryEmberStore.CONFIG_TEMPLATE = null;

//-----------------------------------------------------------
// Initialization and Shutdown
//-----------------------------------------------------------

/**
 * @see Component#_configure
 */
p._configure = function (thywill, config, callback) {
  // Minimal configuration - all we're doing here is storing it for posterity.
  this.thywill = thywill;
  this.config = config;
  this.readyCallback = callback;

  // There are no asynchronous initialization functions here or in the
  // superclasses. So we can just call them and forge ahead without having
  // to wait around or check for completion.
  this._announceReady(this.NO_ERRORS);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------




//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = InMemoryEmberStore;
