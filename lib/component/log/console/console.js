
var util = require("util");
var Log = require("../log");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function Console() {
  Console.super_.call(this);
};
util.inherits(Console, Log);
var p = Console.prototype;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

p._configure = function(config, callback) {

// Minimal configuration - all we're doing here is storing it for posterity.
this.config = config; 
this.readyCallback = callback;

// There are no asynchronous initialization functions here or in the superclasses.
// So we can just call them and forge ahead without having to wait around or check
// for completion.
this.ready = true;
this._announceReady();
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------




//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Console;