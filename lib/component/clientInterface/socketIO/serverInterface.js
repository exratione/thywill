/*
 * Client-side Javascript for the socketIO clientInterface component.
 */

var socket = io.connect("<%= namespace %>");

socket.on("connect", function() {  
  thywill.serverInterface.connected = true;
  
  // set up the necessary functions in the thywill object.
  
  // 1) sending function
  thywill.serverInterface.send = function(message, applicationId) {
    socket.emit("messageFromClient", {data: message, applicationId: applicationId});
  };
  
  // TODO sort this out for cross-browser usage
  function supportsStorage() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }
  // 2) getters and setters for clientId
  thywill.serverInterface.getClientId = function() {
    // using web storage, falling back to local data, not ideal
    if( supportsStorage() ) {
      return localStorage.getItem('thywill-client-ID');
    } else {
      return this.clientId;
    }
  };
  thywill.serverInterface.setClientId = function(clientId) {
    // using web storage
    if( supportsStorage() ) {
      return localStorage.setItem('thywill-client-ID', clientId);
    } else {
      return this.clientId;
    }
  };  
  
  // Negotiate client ID with the server
  var existingClientId = thywill.serverInterface.getClientId();
  socket.emit("idDeclarationFromClient", existingClientId);
});

socket.on("updateClientId", function(clientId) {
  thywill.serverInterface.setClientId(clientId);
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
