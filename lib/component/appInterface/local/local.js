
var util = require("util");
var AppInterface = require("../appInterface");
var Component = require("../../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * The Local app communicates with applications built on thywill.js, 
 * and which run in this same node.js process.
 */
function Local() {
  Local.super_.call(this);
  this.applications = {};
};
util.inherits(Local, AppInterface);
var p = Local.prototype;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

p._registerApplication = function(application, callback) {
  var self = this;
  application.on("thywill.send", function(message, clientId, applicationId) { 
    self.send(message, clientId, applicationId); 
  });
  this.applications[application.id] = application;
  // all of the above is synchronous, so invoke the callback;
  callback();
};

p._configure = function(config, callback) {

  // Minimal configuration - all we're doing here is storing it for posterity.
  this.config = config; 
  this.readyCallback = callback;
  
  // There are no asynchronous initialization functions here or in the superclasses.
  // So we can just call them and forge ahead without having to wait around or check
  // for completion.
  this._announceReady(Component.NO_ERRORS);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.receive = function(message, clientId) {
  if( !message.applicationId ) {
    for( id in this.applications ) {
      this.applications[id].receive(message, clientId);
    }    
  } else if( this.applications[message.applicationId] ) {
    this.applications[message.applicationId].receive(message, clientId); 
  }
};

p.connection = function(client) {
  var len = this.applications.length;
  for( id in this.applications ) {
    this.applications[id].connection(client);
  }   
};

p.disconnection = function(clientId) { 
  var len = this.applications.length;
  for( id in this.applications ) {
    this.applications[id].disconnection(clientId);
  }   
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Local;