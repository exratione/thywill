/*
 * Client-side Javascript for socketIO clientInterface component.
 */

var socket = io.connect("<%= namespace %>");

socket.on("connect", function() {  
  thywill.serverInterface.connected = true;
  
  // set up the thywill send function
  thywill.serverInterface.send = function(message, applicationId) {
    // set up a callback for message receipt confirmation at the server: server must pass back a suitable confirmation object
    socket.emit("messageFromClient", {data: message, applicationId: applicationId}, function(confirmation) {
      thywill.serverInterface.confirmationReceived(confirmation);
    });
  };
  
});

socket.on("messageToClient", function(message) {  
  thywill.serverInterface.messageReceived(message);
});

socket.on("disconnect", function(){  
  thywill.serverInterface.connected = false;
});

socket.on("reconnecting", function(){  
  
});

socket.on("reconnect", function(){  

});