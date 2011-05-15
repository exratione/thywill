var Application = require("../application");
var Message = require("../../component/client/message");
var Resource = require("../../component/resources/resource");
var Component = require("../../component/component");
var util = require("util");
var util = require("path");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * A trivial application example. This does nothing but provide a UI to enter messages, 
 * and echo back all received messages with the same content.
 */
function Echo(id) {
  Application.super_.call(this, id);
};
util.inherits(Echo, Application);
var p = Echo.prototype;

//-----------------------------------------------------------
// Methods 
//-----------------------------------------------------------

p._initializeClientResources = function(callback) {
  // Only one resource is needed, and this must be loaded immediately on client connection.
  // The async method is used as an example for applications with more resources.
  var self = this;
  var fns = [
    function(asyncCallback) {
      var filepath = path.resolve(__dirname, "./echoClient.js");
      var data = new String(fs.readFileSync(filepath));  
      var resource = new Resource(Resource.TYPE_JAVASCRIPT, "/echo/echoClient.js", data);
      self.factory.resources.defineBootstrapResource(resource, asyncCallback);
    }
  ];
  async.parallel(fns, callback);
};

p.receive = function(message, clientId) {
  // Echo back the content of received messages.
  var echoMessage = new Message(message.data, this.id);
  this.send(echoMessage, clientId);
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