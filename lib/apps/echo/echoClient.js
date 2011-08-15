
var echoApplication = {
  
  id: "<%= applicationId %>",
  
  // functions for connecting to the serverInterface and setting up a minimal UI.
    
  setupInput: function() { 
    var self = this;
    jQuery("body").append(
     '<div id="sender">' +
       '<textarea></textarea>' +
       '<button>Send</button>' +
     '</div>'
    );
    jQuery("#sender button").click(function() {
     var inputData = $("#sender textarea").val();  
     if( inputData ) {
       var message = {
         applicationId: self.id,
         data: inputData
       };
       thywill.serverInterface.send(message);
       $("#sender textarea").val("");
     }
    });
  },

  setupOutput: function() {
    jQuery("body").append('<div id="poc-output" style="margin-top: 10px; width: 500px; height: 200px; overflow-y: scroll; border: 1px solid #cccccc;"></div>');
  },
  
  setupListeners: function() {
    thywill.serverInterface.registerApplication(this.id, this);
  },
  
  // functions called by the serverInterface
  
  messageReceived: function(message) {
    jQuery("#poc-output").append('<div>' + message.data + '</div>');
  },
  
  confirmationReceived: function(confirmation) {
    // noop in this case, we don't care about confirmation of receipt at the server
  },
  
  messageError: function(error) {
    console.log(error);
  }  
  
};
  
/*
 * Add a callback that is called when the thywill bootstrap process is complete and applications can start to do their thing.
 */
thywill.callOnReady(function() {
  echoApplication.setupListeners();
  echoApplication.setupInput();
  echoApplication.setupOutput();
});