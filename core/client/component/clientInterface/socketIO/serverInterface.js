/**
 * @fileOverview
 * Client-side Javascript for the socketIO clientInterface component. This 
 * manages the interface between thywill.serverInferface and socket.IO.
 */

// --------------------------------------------------------
// Override necessary functions in Thywill.ServerInterface.
// --------------------------------------------------------

/**
 * Send a message to the server.
 * 
 * @see Thywill.ServerInterface#send
 */
Thywill.ServerInterface.send = function (message) { 
  Thywill.socket.emit("messageFromClient", message);
};

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
  Thywill.ServerInterface.connected = true;
});

// Initial connection failed with timeout.
Thywill.socket.on("connect_failed", function() {
  Thywill.ServerInterface.connectionFailure();
});

//Client is trying to initially connect.
Thywill.socket.on("connecting", function (transport_type) {  
  // Do nothing.
});

// Client is disconnected.
Thywill.socket.on("disconnect", function () { 
  Thywill.ServerInterface.disconnected();
});

// Message received from the server.
Thywill.socket.on("messageToClient", function (message) {  
  Thywill.ServerInterface.received(message);
});

// Client manages to reconnect after disconnection.
Thywill.socket.on("reconnect", function (transport_type, reconnectionAttempts) {  
  Thywill.ServerInterface.reconnected();
});

// Attempts to reconnect are abandoned, timed out.
Thywill.socket.on("reconnect_failed", function() {
  Thywill.ServerInterface.connectionFailure();
});

// Client is trying to reconnect after disconnection.
Thywill.socket.on("reconnecting", function (reconnectionDelay, reconnectionAttempts) {  
  // Do nothing.
});
