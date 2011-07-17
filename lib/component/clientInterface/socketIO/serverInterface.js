var socket = io.connect("<%= namespace %>");

socket.on('connect', function() {  
  thywill.serverInterface.connected = true;
});
socket.on('message', function(message) {  
  console.log(message);
  
});
socket.on('disconnect', function(){  
  thywill.serverInterface.connected = false;
  socket.connect();
});