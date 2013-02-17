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
 * A class to be extended by clientInterface components, to provide the mechanism
 * by which messages pass to and from the server.
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
  thywillObj.ApplicationInterface.prototype.send = function (data, type) {
    if (!data) {
      return;
    }

    var message = new Thywill.Message();
    message.setData(data);
    // Note: no filling in the connectionId on the client side, since we don't
    // know what it is here nor do we need to. That is populated when the
    // message gets to the server.
    message.setFromApplication(this.applicationId);
    message.setToApplication(this.applicationId);
    // If a message type is provided, set it.
    if (type) {
      message.setType(type);
    }
    this.sendMessage(message);
  };

  /**
   * Send a Thywill.Message object to the server, which allows for addressing to
   * specific applications, setting other metadata such as type, etc.
   *
   * @param {Thywill.Message} message
   *   A Thywill.Message instance.
   */
  thywillObj.ApplicationInterface.prototype.sendMessage = function (message) {
    thywillObj.serverInterface.sendMessage(message);
  };

  /**
   * Invoked when a message is received from the server.
   *
   * @param {Thywill.Message} message
   *   A Thywill.Message instance.
   */
  thywillObj.ApplicationInterface.prototype.received = function (message) {
    console.log("ApplicationInterface.received() not implemented in child class.");
  };

  /**
   * Invoked when the client is trying to connect or reconnect.
   */
  thywillObj.ApplicationInterface.prototype.connecting = function () {
    console.log("ApplicationInterface.connecting() not implemented in child class.");
  };

  /**
   * Invoked when the client successfully connects or reconnects after
   * disconnection.
   */
  thywillObj.ApplicationInterface.prototype.connected = function () {
    console.log("ApplicationInterface.connected() not implemented in child class.");
  };

  /**
   * Invoked when the client fails to initially connect or reconnect after
   * disconnection.
   */
  thywillObj.ApplicationInterface.prototype.connectionFailure = function () {
    console.log("ApplicationInterface.connectionFailure() not implemented in child class.");
  };

  /**
   * Invoked when the client is unexpectedly disconnected. This should usually
   * only happen due to network issues, server shutting down, etc.
   */
  thywillObj.ApplicationInterface.prototype.disconnected = function () {
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

  /**
   * Server interface functionality, handling passing of messages and
   * notification of events.
   */
  thywillObj.ServerInterface = function ServerInterface () {
    // Set to true by the clientInterface component when connected.
    this.isConnected = false;
    // A collection of instances of child classes of
    // Thywill.ApplicationInterface.
    this.applications = {};
  };

  /**
   * Register an application so that Thywill can pass it messages.
   *
   * @param {Object} applicationInterface
   *   An instance of a child class of Thywill.ApplicationInterface.
   */
  thywillObj.ServerInterface.prototype.registerApplication = function (applicationInterface) {
    this.applications[applicationInterface.applicationId] = applicationInterface;
  };

  // ---------------------------------------------------------
  // Functions to be defined by the clientInterface component.
  // ---------------------------------------------------------

  /**
   * Send a message to the server.
   *
   * @param {Message} message
   *   Instance of the Thywill.Message class.
   */
  thywillObj.ServerInterface.prototype.sendMessage = function (message) {
    console.log("Thywill.serverInterface.send() not implemented.");
  };

  /**
   * Set up the connection to the server.
   */
  thywillObj.ServerInterface.prototype.setupConnection = function () {
    console.log("Thywill.serverInterface.setupConnection() not implemented.");
  };

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
  thywillObj.ServerInterface.prototype.received = function (rawMessage) {
    if (typeof rawMessage !== "object") {
      return;
    }

    var message = new Thywill.Message();
    message.setData(rawMessage.data);
    message.setMetadata(rawMessage._);
    if (message.isValid()) {
      var to = message.getMetadata(Thywill.Message.METADATA.TO_APPLICATION);
      if (this.applications[to]) {
        this.applications[to].received(message);
      }
    }
  };

  /**
   * A connection is established or reestablished. All applications are notified.
   */
  thywillObj.ServerInterface.prototype.connected = function () {
    this.isConnected = true;
    for (var applicationId in this.applications) {
      this.applications[applicationId].connected();
    }
  };

  /**
   * A connection is established or reestablished. All applications are notified.
   */
  thywillObj.ServerInterface.prototype.connecting = function () {
    for (var applicationId in this.applications) {
      this.applications[applicationId].connecting();
    }
  };

  /**
   * Called when the initial connection or a reconnection attempt times out.
   */
  thywillObj.ServerInterface.prototype.connectionFailure = function () {
    for (var applicationId in this.applications) {
      this.applications[applicationId].connectionFailure();
    }
  };

  /**
   * The connection to the server is lost for whatever reason - typically network issues.
   * All applications are notified.
   */
  thywillObj.ServerInterface.prototype.disconnected = function () {
    this.isConnected = false;
    for (var applicationId in this.applications) {
      this.applications[applicationId].disconnected();
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
