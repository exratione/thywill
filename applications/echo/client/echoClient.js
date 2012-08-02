/**
 * @fileOverview
 * Client Javascript for the Echo application.
 */

var echoApplication = {
  // Will be populated with the application ID via the Handlebars template 
  // engine.
  id: "{{{applicationId}}}",
  
  // -----------------------------------------------------------------------------
  // Functions for connecting to the serverInterface and setting up a minimal UI.
  // -----------------------------------------------------------------------------

  setupUI: function () { 
    var self = this;
    // Rudimentary DOM manipulation. Smarter to template, but so simple there
    // doesn't seem to be much call for that in an example application.
    jQuery("body").append('<div id="echo-wrapper"></div>');
    jQuery("#echo-wrapper").append(
      '<div id="title">Thywill: Echo</div>' +
      '<div id="sender">' +
        '<textarea></textarea>' +
        '<button>Send</button>' +
      '</div>' +
      '<div id="echo-output"></div>' +
      '<div id="instructions">' +
      "Enter text into the upper box and it will be passed through Thywill to the Echo application and back again to appear in the lower box. " +
      "Since this is an example application only there is nothing stopping you from entering page-breaking HTML - so have it at." +
      '</div>'
    );
    jQuery("#sender button").click(function () {
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
    jQuery("#echo-wrapper").append('');
  },
  
  setupListeners: function () {
    thywill.serverInterface.registerApplication(this.id, this);
  },
  
  // ------------------------------------------
  // functions called by the serverInterface
  // ------------------------------------------
  
  messageReceived: function (message) {
    // Add the message content to the output div, and fade it in.
    // No attempt is made to protect against bad content! It's an example
    // application only.
    jQuery('<div>' + message.data + '</div>').hide().appendTo("#echo-output").fadeIn();
  },
  
  confirmationReceived: function (confirmation) {
    // NOOP in this case, as we don't care about confirmation of receipt at the
    // server.
  },
  
  messageError: function (error) {
    console.log(error);
  },
  
  disconnected: function () {
    
  },
  
  reconnected: function () {
    
  }
  
};
  
/**
 * A callback to be invoked when the Thywill bootstrap process is complete
 * and applications can start to do their thing. That might complete before the
 * DOM is ready, so use jQuery.ready() to make sure we wait for that.
 */
thywill.callOnReady(function () {
  jQuery(document).ready(function () {
    echoApplication.setupListeners();
    echoApplication.setupUI();
  });
});