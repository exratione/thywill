
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
  // Setting bootstrap resources: the application code and libraries.
  var self = this;
  var fns = [
    function(asyncCallback) {
      var filepath = path.resolve(__dirname, "./thirdParty/jquery.1.6.1.min.js");
      var data = fs.readFileSync(filepath, "utf-8");  
     
      var resource = new Resource(Resource.TYPE_JAVASCRIPT, 10, "/echo/jquery.js", data);
      self.thywill.clientInterface.defineBootstrapResource(resource, asyncCallback);
    }, 
    
    function(asyncCallback) {
      var filepath = path.resolve(__dirname, "./thirdParty/raphael.1.5.2.min.js");
      var data = fs.readFileSync(filepath, "utf-8");  
     
      var resource = new Resource(Resource.TYPE_JAVASCRIPT, 20, "/echo/raphael.js", data);
      self.thywill.clientInterface.defineBootstrapResource(resource, asyncCallback); 
    }, 
    
    function(asyncCallback) {
      var filepath = path.resolve(__dirname, "./echoClient.js");
      var data = fs.readFileSync(filepath, "utf-8");  
      
      // a little templating to insert the application ID
      data = self.thywill.template.render(data, { applicationId: self.id });
      
      var resource = new Resource(Resource.TYPE_JAVASCRIPT, 30, "/echo/echoClient.js", data);
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
  var echoMessage = new Message(message.data, message.sessionId, this.id);
  this.send(echoMessage);
};

p.connection = function(client) {
  // do nothing
};

p.disconnection = function(sessionId) {
  // do nothing  
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Echo;