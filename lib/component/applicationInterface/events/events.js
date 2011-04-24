
var util = require("util");
var ApplicationInterface = require("../applicationInterface");

//-----------------------------------------------------------
//Class Definition
//-----------------------------------------------------------

/*
 * The Events applicationInterface communicates through events with applications 
 * built on thywill.js that run locally in the same node.js process. The events are:
 * 
 * Emitted:
 * 
 * - thywill.message [client, message]
 * - thywill.connnection [client]
 * - thywill.disconnection [client]
 * 
 * Listened For:
 * 
 * - thywill.send [client, message]
 */
function Events() {};
util.inherits(Events, ApplicationInterface);

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

Events.prototype.configure = function(config, callback){
  // Minimal configuration - all we're doing here is storing it for posterity.
  this.config = config; 
  this.readyCallback = callback;
  
  // There are no asynchronous initialization functions here or in the superclasses.
  // So we can just call them and forge ahead without having to wait around or check
  // for completion.
  this._initialize(); 
  this.ready = true;
  this._announceReady();
};

Events.prototype.receive = function(client, message) {
  this.emit("thywill.receive", client, message); 
};

Events.prototype.connection = function(client) {
  this.emit("thywill.connection", client); 
};

Events.prototype.disconnection = function(client) { 
  this.emit("thywill.disconnection", client); 
};

//-----------------------------------------------------------
// Exports
//-----------------------------------------------------------

var events = new Events();
events.on("thywill.send", this.send);

module.exports = events;
