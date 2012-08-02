/**
 * @fileOverview
 * Client Javascript for the Echo application.
 */

var echoApplication = {
  // Will be populated with the application ID via the Handlebars template 
  // engine.
  id: "{{{applicationId}}}",
  
  // For storing Handlebars.js templates.
  templates: {},
  
  // -----------------------------------------------------------------------------
  // Functions for connecting to the serverInterface and setting up a minimal UI.
  // -----------------------------------------------------------------------------

  setupUI: function () { 
    this.templates.uiTemplate = Handlebars.compile(jQuery("#{{{uiTemplateId}}}").html());
    this.templates.messageTemplate = Handlebars.compile(jQuery("#{{{messageTemplateId}}}").html());

    jQuery("body").append(this.templates.uiTemplate({
      title: "Thywill: Echo",
      buttonText: "Send"
    }));
    
    jQuery("#sender button").click(function () {
     var inputData = $("#sender textarea").val();  
     if (inputData) {
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
  // Functions called by the serverInterface.
  // ------------------------------------------
  
  messageReceived: function (message) {
    // Add the message content to the output div, and fade it in.
    // No attempt is made to protect against bad content! It's an example
    // application only.
    var rendered = this.templates.messageTemplate(message);
    jQuery(rendered).hide().appendTo("#echo-output").fadeIn();
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