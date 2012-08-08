/**
 * @fileOverview
 * The main bootstrap framework code for Thywill, to run on a browser.
 * 
 * The structure is:
 * 
 * 1) Thywill.ApplicationInterface
 * 
 * A class to be extended by applications.
 * 
 * 2) Thywill.Message
 * 
 * A wrapper class for messages sent to and from the server.
 * 
 * 3) Thywill.ServerInterface
 * 
 * Functionality related to server communication. Application code has no need
 * to touch this, but the client Interface code from core Thywill makes use of
 * it.
 * 
 * 4) Thywill.addReadyCallback(callback)
 * 
 * A function to add a callback to be invoked when Thywill is connected and
 * ready to work.
 */

var Thywill = (function() {
  thywillObj = {};
  
  // -----------------------------------------------------
  // Application interface class.
  // -----------------------------------------------------
  
  /**
   * @class
   * Applications must implement a child class in their client code. Most of
   * the functions in this class are called by Thywill as a result of 
   * messages received from the server or other circumstances.
   */
  thywillObj.ApplicationInterface = function (applicationId) {
    this.applicationId = applicationId;
  };
  var p = thywillObj.ApplicationInterface.prototype;
  
  /**
   * Send a message to the server. 
   * 
   * @param {Thywill.Message} message
   *   A Thywill.Message instance.
   */
  p.send = function (message) {
    thywillObj.ServerInterface.send(message);
  };
  
  /**
   * Invoked when a message is received from the server.
   * 
   * @param {Thywill.Message} message
   *   A Thywill.Message instance.
   */
  p.received = function (message) {
    console.log("ApplicationInterface.receive() not implemented in child class.");
  };
  
  /**
   * Invoked when the client fails to initially connect or reconnect after 
   * disconnection.
   */
  p.connectionFailure = function () {
    console.log("ApplicationInterface.connectionFailure() not implemented in child class.");
  };
  
  /**
   * Invoked when the client is unexpectedly disconnected. This should usually
   * only happen due to network issues, server shutting down, etc.
   */
  p.disconnected = function () {
    console.log("ApplicationInterface.disconnected() not implemented in child class.");
  };
  
  /**
   * Invoked when a disconnected client is reconnected.
   */
  p.reconnected = function () {
    console.log("ApplicationInterface.reconnected() not implemented in child class.");
  };
  
  // -----------------------------------------------------
  // Message class.
  // -----------------------------------------------------
  
  /**
   * @class
   * A Message instance wraps data for delivery between client and server.
   * 
   * @param {string} data
   *   The body of the message.
   * @param {string} fromApplicationId
   *   The ID of the originating application.
   * @param {string} [toApplicationId]
   *   If not null, the message is flagged for delivery to this application only.
   */
  thywillObj.Message = function (data, fromApplicationId, toApplicationId) {
    this.data = data;
    this.fromApplicationId = fromApplicationId;
    this.toApplicationId = toApplicationId;
  };
  
  // -----------------------------------------------------
  // Main server interface.
  // -----------------------------------------------------
  
  // A collection of instances of child classes of 
  // Thywill.ApplicationInterface.
  var applications = {};
  // An array of functions that will be called when the server interface
  // is connected and ready.
  var readyCallbacks = [];
  
  /**
   * Server interface functionality, handling passing of messages and
   * notification of events.
   */
  thywillObj.ServerInterface = {
    // Set to true by the clientInterface component when connected.
    connected: false,     

    /**
     * Register an application so that Thywill can pass it messages.
     * 
     * @param {object} applicationInterface
     *   An instance of a child class of Thywill.ApplicationInterface.
     */
    registerApplication: function (applicationInterface) {
      applications[applicationInterface.applicationId] = applicationInterface;
    },
    
    /**
     * A function to check whether we are done yet - i.e. are we connected
     * to the server and set up? If so, call the ready callback functions
     * defined to date. If not, keep checking.
     */
    checkCompletion: function () {
      var self = this;
      if (this.connected) {
        for (var i = 0, l = readyCallbacks.length; i < l; i++) {
          readyCallbacks[i].call(this);
        }
      } else {
        setTimeout(function() {
          self.checkCompletion();
        }, 100);
      }
    },
    
    // ---------------------------------------------------------
    // Functions to be defined by the clientInterface component.
    // ---------------------------------------------------------
    
    /**
     * Send a message to the server.
     * 
     * @param {Message} message
     *   Instance of the Thywill.Message class.
     */
    send: function (message) {
      console.log("Thywill.ServerInterface.send() not implemented.");
    },      
    
    // ------------------------------------------------
    // Functions called by the clientInterface.
    // ------------------------------------------------
    
    /**
     * A message has arrived from the server. This function routes it to a
     * specific application, or to all applications if it isn't specifically
     * addressed.
     * 
     * @param {Object} rawMessage
     *   An object representation of the message.
     */
  	received: function (rawMessage) {
  	  var message = new Thywill.Message(rawMessage.data, rawMessage.fromApplicationId, rawMessage.toApplicationId);
  	  if (message.toApplicationId) {
  	    if (applications[message.toApplicationId]) {
  	      applications[message.toApplicationId].received(message);
  	    }
  	  } else {
  	    for (var applicationId in applications) {
  	      applications[applicationId].received(message);
  	    }
  	  }
  	},	
  	
  	/**
  	 * Called when the initial connection or a reconnection attempt times out.
  	 */
  	connectionFailure: function() {
  	  for (var applicationId in applications) {
        applications[applicationId].connectionFailure();
      }
  	},
  	
  	/**
  	 * The connection to the server is lost for whatever reason - typically network issues.
  	 * All applications are notified.
  	 */
  	disconnected: function () {
  	  this.connected = false;
  	  for (var applicationId in applications) {
        applications[applicationId].disconnected();
  	  }
  	},
  	
  	/**
  	 * A lost connection is reestablished. All applications are notified.
  	 */
    reconnected: function () {
      this.connected = true;
      for (var applicationId in applications) {
        applications[applicationId].reconnected();
      }
    }
  };
  
  /**
   * Provide a callback function that will be invoked when Thywill is
   * connected to the server and ready to run.
   */
  thywillObj.addReadyCallback = function (callback) {
    readyCallbacks.push(callback);
  };
  
  return thywillObj;
})();
