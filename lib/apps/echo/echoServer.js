
var util = require("util");
var path = require("path");
var fs = require("fs");

var async = require("async");

var Application = require("../application");
var Message = require("../../component/clientInterface/message");
var Resource = require("../../component/clientInterface/resource");
var Component = require("../../component/component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * A trivial application example. This does nothing but provide a UI to enter messages, 
 * and echo back all received messages with the same content.
 */
function Echo(id) {
  Echo.super_.call(this, id);
};
util.inherits(Echo, Application);
var p = Echo.prototype;

//-----------------------------------------------------------
// Initialization and Shutdown
//-----------------------------------------------------------

p._defineClientResources = function(callback) {
  // Only one resource is needed, and this must be loaded immediately on client connection.
  // The async method is used as an example for applications with more resources.
  var self = this;
  var fns = [
    function(asyncCallback) {
      var filepath = path.resolve(__dirname, "./echoClient.js");
      var data = fs.readFileSync(filepath, "utf-8");  
      
      // a little templating to insert the application ID
      data = self.thywill.template.render(data, { applicationId: self.id });
      
      var resource = new Resource(Resource.TYPE_JAVASCRIPT, "/echo/echoClient.js", data);
      self.thywill.clientInterface.defineBootstrapResource(resource, asyncCallback);
    }
  ];
  async.parallel(fns, callback);
};

p._prepareForShutdown = function(callback) {
  // nothing needed
  callback.call(this);
};

//-----------------------------------------------------------
// Methods 
//-----------------------------------------------------------


p.receive = function(message) {
  // Echo back the content of received messages.
  var echoMessage = new Message(message.data, message.clientId, this.id);
  this.send(echoMessage);
};

p.connection = function(client) {
  // do nothing
};

p.disconnection = function(clientId) {
  // do nothing  
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Echo;