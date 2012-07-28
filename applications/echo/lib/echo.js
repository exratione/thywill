/**
 * @fileOverview
 * Echo class definition, a trivial example application.
 */

var util = require("util");
var path = require("path");
var fs = require("fs");

var async = require("async");

var Application = require("../../../core/lib/component/application/application");
var Message = require("../../../core/lib/component/clientInterface/message");
var Resource = require("../../../core/lib/component/clientInterface/resource");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A trivial example application.
 * 
 * This does nothing but provide a UI to enter messages, 
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

/**
 * Define the resources used by the application.
 * 
 * @param {Function} callback
 *   Of the form function (error) {}, where error == null on success.
 */
p._defineClientResources = function (callback) {
  // Setting bootstrap resources: the application code and libraries.
  var self = this;
  var fns = [
    function (asyncCallback) {
      var filepath = path.resolve(__dirname, "../client/thirdParty/jquery.1.7.2.min.js");
      var data = fs.readFileSync(filepath, "utf-8");  
     
      var resource = new Resource(Resource.TYPE_JAVASCRIPT, 10, "/echo/jquery.js", data);
      self.thywill.clientInterface.defineBootstrapResource(resource, asyncCallback);
    },
    
    function (asyncCallback) {
      var filepath = path.resolve(__dirname, "../client/echoClient.js");
      var data = fs.readFileSync(filepath, "utf-8");  
      
      // A little templating to insert the application ID.
      data = self.thywill.template.render(data, { applicationId: self.id });
      
      var resource = new Resource(Resource.TYPE_JAVASCRIPT, 30, "/echo/echoClient.js", data);
      self.thywill.clientInterface.defineBootstrapResource(resource, asyncCallback);
    }
  ];
  async.parallel(fns, callback);
};

/**
 * Perform any actions needed prior to Thywill shutdown.
 * 
 * @param {Function} callback
 *   Of the form function () {}.
 */
p._prepareForShutdown = function (callback) {
  // Nothing needs doing here.
  callback.call(this);
};

//-----------------------------------------------------------
// Methods 
//-----------------------------------------------------------

/**
 * Called when a message is received. Echo back the content of received 
 * messages.
 * 
 * @param {Message} message
 *   Instance of the Message class.
 */
p.receive = function (message) {
  var echoMessage = new Message(message.data, message.sessionId, this.id);
  this.send(echoMessage);
};

/**
 * Called when a client connects or reconnects.
 * 
 * @param {string} sessionId
 *   Unique ID of the session.
 */
p.connection = function (sessionId) {
  // Do nothing.
};

/**
 * Called when a client disconnects.
 * 
 * @param {string} sessionId
 *   Unique ID of the session.
 */
p.disconnection = function (sessionId) {
  // Do nothing.
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Echo;