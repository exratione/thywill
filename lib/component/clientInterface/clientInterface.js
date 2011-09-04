
var util = require("util");
var Component = require("../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function ClientInterface() {
  ClientInterface.super_.call(this);
  this.componentType = "clientInterface";
};
util.inherits(ClientInterface, Component);
var p = ClientInterface.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/*
 * Called when a message is received from a client.
 * 
 * message: instance of Message class
 */
p.receive = function(message) {
  var self = this;
  if( !message.applicationId ) {
    for( id in this.thywill.applications ) {
      process.nextTick(function() {
        self.thywill.applications[id].receive(message);
      });
    }    
  } else if( this.thywill.applications[message.applicationId] ) {
    this.thywill.applications[message.applicationId].receive(message); 
  }
};

/*
 * Called when a client connects or reconnects.
 * 
 * sessionId: unique ID of the session.
 */
p.connection = function(sessionId) {
  var self = this;
  for( id in this.thywill.applications ) {
    process.nextTick(function() {
      self.thywill.applications[id].connection(sessionId);
    });
  }
};

/*
 * Called when a client disconnects.
 * 
 * sessionId: unique ID of the session.
 */
p.disconnection = function(sessionId) {
  var self = this;
  for( id in this.thywill.applications ) {
    process.nextTick(function() {
      self.thywill.applications[id].disconnection(sessionId);
    });
  }
};

//-----------------------------------------------------------
//Methods to be implemented by subclasses.
//-----------------------------------------------------------

/*
 * Start the client interface running - should be the very last initialization call, 
 * after all resources are set by all applications and components.
 * 
 * callback - function(error), where error == Component.NO_ERROR on success. 
 */
p._startup = function(callback) {
  throw new Error("Not implemented.");  
};

/*
 * A resource to be loaded immediately on client connection.
 * 
 * callback - function(error), where error == Component.NO_ERROR on success.
 */
p.defineBootstrapResource = function(resource, callback) {
  throw new Error("Not implemented.");
};

/*
 * Return all bootstrap resource objects defined to date.
 * 
 * callback - function(error, [resource, resource...]), where error == null on success
 */
p.getBootstrapResources = function(callback) {
  throw new Error("Not implemented."); 
};

/*
 * A resource to be loaded at some point after client connection.
 * 
 * callback - function(error), where error == null on success.
 */
p.defineResource = function(resource, callback) {
  throw new Error("Not implemented.");
};

/*
 * Pass a resource or null to the callback if no resource is mapped to this path.
 * 
 * callback - function(error, resource), where error == null on success.
 */
p.getResource = function(path, callback) {
  throw new Error("Not implemented.");
};

/*
 * Send a message out to a particular client.
 * 
 * message: instance of Message class
 */
p.send = function(message) {
  throw new Error("Not implemented.");  
};

/*
 * Store key-value data for a specific session.
 * 
 * sessionId: unique session ID
 * key: key for the data
 * value: any object
 * callback: function(error) where error == null on success
 */
p.setSessionData = function(sessionId, key, value, callback) {
  throw new Error("Not implemented."); 
};

/*
 * Retrieve the value data for a specific session and key.
 * 
 * sessionId: unique client ID
 * key: key for the data
 * callback: function(error, value) where error == null on success
 */
p.getSessionData = function(sessionId, key, callback) {
  throw new Error("Not implemented."); 
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ClientInterface;