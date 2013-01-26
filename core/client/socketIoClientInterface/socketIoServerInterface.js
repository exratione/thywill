/*global
  io: false,
  Thywill: false
*/
/**
 * @fileOverview
 * Client-side Javascript for the Socket.IO clientInterface component. This
 * links Thywill.serverInterface and Socket.IO functionality.
 */

// --------------------------------------------------------
// Class definition.
// --------------------------------------------------------

/**
 * @class
 * @see Thywill.ServerInterface
 *
 * Use Socket.IO for the interface to the server.
 */
Thywill.SocketIoServerInterface = function SocketIoServerInterface () {
  Thywill.ServerInterface.call(this);
};
Thywill.inherits(Thywill.SocketIoServerInterface, Thywill.ServerInterface);

// --------------------------------------------------------
// Override necessary functions in Thywill.ServerInterface.
// --------------------------------------------------------

/**
 * Send a Thywill.Message instance to the server.
 *
 * @see Thywill.ServerInterface#send
 */
Thywill.SocketIoServerInterface.prototype.sendMessage = function (message) {
  Thywill.socket.emit("fromClient", message);
};

Thywill.SocketIoServerInterface.prototype.setupConnection = function () {
  var self = this;
  // Create the socket and connect. The parameters here are provided by
  // Handlebars.js templating when this Javascript file is turned into a
  // resource by the server.
  Thywill.socket = io.connect("{{{namespace}}}", {{{config}}});

  //------------------------------------
  // serverInterface interaction
  //------------------------------------

  /**
   * Functions to associate this implementation with Thywill.ServerInterface.
   * That will in turn convey messages and events to the various running
   * and registered applications.
   */

  // Initial connection succeeds.
  Thywill.socket.on("connect", function () {
    self.connected();
  });

  // Initial connection failed with timeout.
  Thywill.socket.on("connect_failed", function() {
    self.connectionFailure();
  });

  // Client is trying to initially connect.
  Thywill.socket.on("connecting", function (transport_type) {
    self.connecting();
  });

  // Client is disconnected.
  Thywill.socket.on("disconnect", function () {
    self.disconnected();
  });

  // Message received from the server.
  Thywill.socket.on("toClient", function (message) {
    self.received(message);
  });

  // Client manages to reconnect after disconnection.
  Thywill.socket.on("reconnect", function (transport_type, reconnectionAttempts) {
    self.connected();
  });

  // Attempts to reconnect are abandoned, timed out.
  Thywill.socket.on("reconnect_failed", function() {
    self.connectionFailure();
  });

  // Client is trying to reconnect after disconnection.
  Thywill.socket.on("reconnecting", function (reconnectionDelay, reconnectionAttempts) {
    self.connecting();
  });
};

// --------------------------------------------------------
// Set the server interface.
// --------------------------------------------------------

Thywill.serverInterface = new Thywill.SocketIoServerInterface();
