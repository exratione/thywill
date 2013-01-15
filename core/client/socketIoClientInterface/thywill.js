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
  var thywillObj = {};

  // -----------------------------------------------------
  // Application interface class.
  // -----------------------------------------------------

  /**
   * @class
   * Applications must implement a child class in their client code. Most of
   * the functions in this class are called by Thywill as a result of
   * messages received from the server or other circumstances.
   *
   * @param {string} applicationId
   *   The unique ID for this application.
   */
  thywillObj.ApplicationInterface = function ApplicationInterface (applicationId) {
    this.applicationId = applicationId;
  };
  var p = thywillObj.ApplicationInterface.prototype;

  /**
   * Send data to the server. This will be delivered to the server side
   * component for this application.
   *
   * To address to other server applications, use sendMessage(message)
   * with a Thywill.Message instance.
   *
   * @param {mixed} data
   *   Any Javascript entity, but usually an object.
   * @param {string} [type]
   *   Optionally, set the message type metadata.
   */
  p.send = function (data, type) {
    if (!data) {
      return;
    }

    var message = new Thywill.Message();
    message.setData(data);
    var metadata = {};
    // Note: no filling in the connectionId on the client side, since we don't
    // know what it is here nor do we need to. That is populated when the
    // message gets to the server.
    metadata[Thywill.Message.METADATA.FROM_APPLICATION] = this.applicationId;
    metadata[Thywill.Message.METADATA.TO_APPLICATION] = this.applicationId;
    // Technically these two aren't necessary either, but may as well put them
    // there to indicate intent.
    metadata[Thywill.Message.METADATA.DESTINATION] = Thywill.Message.DESTINATIONS.SERVER;
    metadata[Thywill.Message.METADATA.ORIGIN] = Thywill.Message.ORIGINS.CLIENT;
    // If a message type is provided, set it.
    if (type) {
      metadata[Thywill.Message.METADATA.TYPE] = type;
    }
    message.setMetadata(metadata);
    this.sendMessage(message);
  };

  /**
   * Send a Thywill.Message object to the server, which allows for addressing to
   * specific applications, setting other metadata such as type, etc.
   *
   * @param {Thywill.Message} message
   *   A Thywill.Message instance.
   */
  p.sendMessage = function (message) {
    thywillObj.ServerInterface.sendMessage(message);
  };

  /**
   * Invoked when a message is received from the server.
   *
   * @param {Thywill.Message} message
   *   A Thywill.Message instance.
   */
  p.received = function (message) {
    console.log("ApplicationInterface.received() not implemented in child class.");
  };

  /**
   * Invoked when the client is trying to connect or reconnect.
   */
  p.connecting = function () {
    console.log("ApplicationInterface.connecting() not implemented in child class.");
  };

  /**
   * Invoked when the client successfully connects or reconnects after
   * disconnection.
   */
  p.connected = function () {
    console.log("ApplicationInterface.connected() not implemented in child class.");
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

  // -----------------------------------------------------
  // Message class.
  // -----------------------------------------------------

  /**
   * @class
   * A Message instance wraps data for delivery between client and server.
   */
{{{messageClass}}}
  thywillObj.Message = Message;

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
    isConnected: false,

    /**
     * Register an application so that Thywill can pass it messages.
     *
     * @param {Object} applicationInterface
     *   An instance of a child class of Thywill.ApplicationInterface.
     */
    registerApplication: function (applicationInterface) {
      applications[applicationInterface.applicationId] = applicationInterface;
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
    sendMessage: function (message) {
      console.log("Thywill.ServerInterface.send() not implemented.");
    },

    /**
     * Set up the connection to the server.
     */
    setupConnection: function () {
      console.log("Thywill.ServerInterface.setupConnection() not implemented.");
    },

    // ------------------------------------------------
    // Functions called by the clientInterface.
    // ------------------------------------------------

    /**
     * A message has arrived from the server. This function routes it to a
     * specific application.
     *
     * @param {Object} rawMessage
     *   An object representation of the message.
     */
    received: function (rawMessage) {
      if (typeof rawMessage !== "object") {
        return;
      }

      var message = new Thywill.Message();
      message.setData(rawMessage.data);
      message.setMetadata(rawMessage._);
      if (message.isValid()) {
        var to = message.getMetadata(Thywill.Message.METADATA.TO_APPLICATION);
        if (applications[to]) {
          applications[to].received(message);
        }
      }
    },

    /**
     * A connection is established or reestablished. All applications are notified.
     */
    connected: function () {
      this.isConnected = true;
      for (var applicationId in applications) {
        applications[applicationId].connected();
      }
    },

    /**
     * A connection is established or reestablished. All applications are notified.
     */
    connecting: function () {
      for (var applicationId in applications) {
        applications[applicationId].connecting();
      }
    },

    /**
     * Called when the initial connection or a reconnection attempt times out.
     */
    connectionFailure: function () {
      for (var applicationId in applications) {
        applications[applicationId].connectionFailure();
      }
    },

    /**
     * The connection to the server is lost for whatever reason - typically network issues.
     * All applications are notified.
     */
    disconnected: function () {
      this.isConnected = false;
      for (var applicationId in applications) {
        applications[applicationId].disconnected();
      }
    }
  };

  // -----------------------------------------------------
  // Utilities, odds and ends.
  // -----------------------------------------------------

  /**
   * Since we don't depend on any specific framework, here's a utility for inheritance,
   * as done in Node.js.
   *
   * TODO: Won't work in older browsers, of course.
   *
   * e.g. Thywill.inherits(subclass, superclass);
   */
  thywillObj.inherits = function inherits (ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
          value: ctor,
          enumerable: false
      }
    });
  };

  return thywillObj;
})();
