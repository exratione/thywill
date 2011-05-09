
var util = require("util");
var Component = require("../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function Database() {
  Database.super_.call(this);
  this.componentType = "log";
};
util.inherits(Database, Component);
var p = Database.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------



//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------



//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Database;