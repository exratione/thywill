
var ejs = require('ejs');
var util = require("util");
var Template = require("../template");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * Using the ejs templating system. See:
 * 
 * https://github.com/visionmedia/ejs
 */
function EJS(componentFactory) {
  EJS.super_.call(this, componentFactory);
};
util.inherits(EJS, Template);
var p = EJS.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

EJS.CONFIG_TEMPLATE = null;

//-----------------------------------------------------------
// Initialization and Shutdown
//-----------------------------------------------------------

p._configure = function(thywill, config, callback) {

  // Minimal configuration - all we're doing here is storing it for posterity.
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
  
  // There are no asynchronous initialization functions here or in the superclasses.
  // So we can just call them and forge ahead without having to wait around or check
  // for completion.
  this._announceReady(this.NO_ERRORS);
};

p._prepareForShutdown = function(callback) {
  // nothing needed
  callback.call(this);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.render = function(templateString, valuesObj) {
  return ejs.render(templateString, { locals: valuesObj });
};



//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = EJS;