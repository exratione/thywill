/*global
  io: false
*/
/**
 * @fileOverview
 * The main framework code for Thywill, to run on a browser.
 *
 * The important structure is:
 *
 * 1) SocketIoThywill.ApplicationInterface
 *
 * A class to be extended by applications.
 *
 * 2) SocketIoThywill.Message
 *
 * A wrapper class for messages sent to and from the server.
 */

var Thywill;

(function() {
  "use strict";

  // -----------------------------------------------------
  // Utility functions.
  // -----------------------------------------------------

  /**
   * Since we don't depend on any specific framework, here's a utility for
   * inheritance, as done in Node.js.
   *
   * TODO: Won't work in older browsers, of course.
   *
   * e.g. SocketIoThywill.inherits(subclass, superclass);
   */
  function inherits (ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false
      }
    });
  };

  // -----------------------------------------------------
  // Class definition.
  // -----------------------------------------------------

  /**
   * @class
   * The main Thywill class.
   *
   * An instance will emit these events, which ApplicationInterface instances
   * listen for in order to re-emit and invoke appropriate functions.
   *
   * connected
   * connecting
   * connectionFailure
   * disconnected
   * received
   *
   * The last event in the list is an arriving message, the others notices of
   * connection state.
   *
   * @param {string} applicationId
   *   The unique ID for this application.
   */
  function SocketIoThywill () {
    SocketIoThywill.super_.call(this);
    this.isConnected = false;
  }
  inherits(SocketIoThywill, io.EventEmitter);
  var p = SocketIoThywill.prototype;

  // -----------------------------------------------------
  // Other classes.
  // -----------------------------------------------------

  /**
   * @class
   * A Message instance wraps data for delivery between client and server.
   *
   * This is a clone of the server-side Message class.
   */
{{{messageClass}}}
  p.Message = Message;

  /**
   * Placeholder for the base application interface class.
   */
  p.ApplicationInterface = undefined;

  //------------------------------------
  // Methods: setup and initialization.
  //------------------------------------

  /**
   * Set up the Socket.IO connection to the server.
   */
  p.setupConnection = function () {
    var self = this;
    // Create the socket and connect. The parameters here are provided by
    // Handlebars.js templating when this Javascript file is turned into a
    // resource by the server.
    this.socket = io.connect("{{{namespace}}}", {{{config}}});

    //------------------------------------
    // Interaction with Socket.IO.
    //------------------------------------

    // Initial connection succeeds.
    this.socket.on("connect", function () {
      self.isConnected = true;
      self.emit("connected");
    });

    // Initial connection failed with timeout.
    this.socket.on("connect_failed", function() {
      self.emit("connectionFailure");
    });

    // Client is trying to initially connect.
    this.socket.on("connecting", function (transport_type) {
      self.emit("connecting");
    });

    // Client is disconnected.
    this.socket.on("disconnect", function () {
      self.connected = false;
      self.emit("disconnected");
    });

    // Message received from the server.
    this.socket.on("toClient", function (applicationId, rawMessage) {
      if (!rawMessage || typeof rawMessage !== "object") {
        return;
      }

      var message = new Thywill.Message(rawMessage.data, rawMessage._);
      if (message.isValid()) {
        self.emit("received", applicationId, message);
      }
    });

    // Client manages to reconnect after disconnection.
    this.socket.on("reconnect", function (transport_type, reconnectionAttempts) {
      self.isConnected = true;
      self.emit("connected");
    });

    // Attempts to reconnect are abandoned, timed out.
    this.socket.on("reconnect_failed", function() {
      self.emit("connectionFailure");
    });

    // Client is trying to reconnect after disconnection.
    this.socket.on("reconnecting", function (reconnectionDelay, reconnectionAttempts) {
      self.emit("connecting");
    });
  };

  // -----------------------------------------------------
  // Methods
  // -----------------------------------------------------

  /**
   * Send a Thywill.Message object to the server.
   *
   * @param {string} applicationId
   *   The ID of the sending application.
   * @param {mixed|Thywill.Message} message
   *   Any data or a Thywill.Message instance
   */
  p.send = function (applicationId, message) {
    if (!(message instanceof Thywill.Message)) {
      message = new Thywill.Message(message);
    }
    this.socket.emit("fromClient", applicationId, message);
  };

  // -----------------------------------------------------
  // Methods: utilities.
  // -----------------------------------------------------

  /**
   * @see inherits.
   */
  p.inherits = inherits;

  // -----------------------------------------------------
  // Set an instance, and start the connection setup.
  // -----------------------------------------------------

  Thywill = new SocketIoThywill();
  Thywill.setupConnection();

})();
