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
  
  
  // TODO: sort out better alternatives to local storage if it isn't present.
  
  function supportsStorageFn() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }
  var supportsStorage = supportsStorageFn();
  
  // 2) getters and setters for clientId
  thywill.serverInterface.getClientId = function() {
    // using web storage and falling back to local data, which is far from ideal
    if( supportsStorage ) {
      return localStorage.getItem('thywill-client-ID');
    } else {
      return this.clientId;
    }
  };
  thywill.serverInterface.setClientId = function(clientId) {
    // using web storage
    if( supportsStorage ) {
      localStorage.setItem('thywill-client-ID', clientId);
    } else {
      this.clientId = clientId;
    }
  };  
  
  // Negotiate client ID with the server
  var existingClientId = thywill.serverInterface.getClientId();
  socket.emit("idDeclarationFromClient", existingClientId);
});

//------------------------------------
// serverInterface interaction
//------------------------------------

/*
 * Functions to associate this implementation with thywill.serverInterface. That will
 * in turn convey messages and events to the various running applications.
 */

socket.on("updateClientId", function(clientId) {
  thywill.serverInterface.setClientId(clientId);
});

socket.on("messageToClient", function(message) {  
  thywill.serverInterface.messageReceived(message);
});

socket.on("disconnect", function(){  
  thywill.serverInterface.disconnected();
});

socket.on("reconnecting", function(){  
  
});

socket.on("reconnect", function(){  
  thywill.serverInterface.reconnected();
});
