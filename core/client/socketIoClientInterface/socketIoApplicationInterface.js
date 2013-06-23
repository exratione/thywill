/*global
  io: false,
  Thywill: false
*/
/**
 * @fileOverview
 * Client ApplicationInterface definition.
 */

(function () {
  "use strict";

  /**
   * @class
   * Applications must implement a child class of Thywill.ApplicationInterface
   * in their client code.
   *
   * Many of the methods in this class are invoked by Thywill as a result of
   * messages received from the server or other circumstances, such as
   * connection and disconnection.
   *
   * Additionally, an instance of Thywill.ApplicationInterface will emit events
   * corresponding to these function calls:
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
  Thywill.ApplicationInterface = function SocketIoApplicationInterface (applicationId) {
    Thywill.ApplicationInterface.super_.call(this);
    this.applicationId = applicationId;
    // Listen for traffic. These are separate functions to allow for easier
    // overriding in child classes.
    this._listenForConnected();
    this._listenForConnectionFailure();
    this._listenForConnecting();
    this._listenForDisconnected();
    this._listenForReceived();
  };
  Thywill.inherits(Thywill.ApplicationInterface, io.EventEmitter);
  var p = Thywill.ApplicationInterface.prototype;

  //------------------------------------
  // Methods: initialization.
  //------------------------------------

  p._listenForConnected = function () {
    var self = this;
    // Initial connection succeeds.
    Thywill.on("connected", function () {
      self.connected();
      self.emit("connected");
    });
  };

  p._listenForConnectionFailure = function () {
    var self = this;
    // Initial connection failed with timeout.
    Thywill.on("connectionFailure", function() {
      self.connectionFailure();
      self.emit("connectionFailure");
    });
  };

  p._listenForConnecting = function () {
    var self = this;
    // Client is trying to connect or reconnect.
    Thywill.on("connecting", function (transport_type) {
      self.connecting();
      self.emit("connecting");
    });
  };

  p._listenForDisconnected = function () {
    var self = this;
    // Client is disconnected.
    Thywill.on("disconnected", function () {
      self.disconnected();
      self.emit("disconnected");
    });
  };

  p._listenForReceived = function () {
    var self = this;
    // Message received from the server.
    Thywill.on("received", function (applicationId, message) {
      if (applicationId !== self.applicationId) {
        return;
      }
      self.received(message);
      self.emit("received", message);
    });
  };

  //------------------------------------
  // Methods.
  //------------------------------------

  /**
   * Send a Thywill.Message object to the server.
   *
   * @param {mixed|Thywill.Message} message
   *   Any data or a Thywill.Message instance
   */
  p.send = function (message) {
    if (!(message instanceof Thywill.Message)) {
      message = new Thywill.Message(message);
    }
    Thywill.send(this.applicationId, message);
  };

  /**
   * Invoked when a message is received from the server.
   *
   * @param {Thywill.Message} message
   *   A Thywill.Message instance.
   */
  p.received = function (message) {};

  /**
   * Invoked when the client is trying to connect or reconnect.
   */
  p.connecting = function () {};

  /**
   * Invoked when the client successfully connects or reconnects after
   * disconnection.
   */
  p.connected = function () {};

  /**
   * Invoked when the client fails to initially connect or fails to reconnect
   * after disconnection.
   */
  p.connectionFailure = function () {};

  /**
   * Invoked when the client is unexpectedly disconnected. This should usually
   * only happen due to network issues, server shutting down, etc.
   */
  p.disconnected = function () {};

})();
