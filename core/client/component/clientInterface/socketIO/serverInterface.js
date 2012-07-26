/**
 * @fileOverview
 * Client-side Javascript for the socketIO clientInterface component. This 
 * manages the interface between thywill.serverInferface and socket.IO.
 */

var socket = io.connect("<%= namespace %>");

socket.on("connect", function() {  
  thywill.serverInterface.connected = true;
  
  // Set up any necessary functions in the thywill object.
  //
  // Sending function
  thywill.serverInterface.send = function(message, applicationId) {
    socket.emit("messageFromClient", {data: message, applicationId: applicationId});
  };
});

//------------------------------------
// serverInterface interaction
//------------------------------------

/**
 * Functions to associate this implementation with thywill.serverInterface. That will
 * in turn convey messages and events to the various running applications.
 */

socket.on("messageToClient", function(message) {  
  thywill.serverInterface.messageReceived(message);
});

socket.on("disconnect", function(){  
  thywill.serverInterface.disconnected();
});

socket.on("reconnecting", function(){  
  // Do nothing.
});

socket.on("reconnect", function(){  
  thywill.serverInterface.reconnected();
});
