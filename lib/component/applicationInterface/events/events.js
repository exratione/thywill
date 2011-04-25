
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
function Events() {
  Events.super_.call(this);
  this._startListening();
  
};
util.inherits(Events, ApplicationInterface);
var p = Events.prototype;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

p._startListening = function(){
  
  
//TODO DEAL WITH EVENTS MODEL
  
  
  this.on("thywill.send", this.send);
};

p._configure = function(config, callback){

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

p.receive = function(client, message) {
  this.emit("thywill.receive", client, message); 
};

p.connection = function(client) {
  this.emit("thywill.connection", client); 
};

p.disconnection = function(client) { 
  this.emit("thywill.disconnection", client); 
};

//-----------------------------------------------------------
// Exports - Instantiated Object
//-----------------------------------------------------------

module.exports = new Events();

