/**
 * @fileOverview
 * Client Javascript for the Echo application.
 */

(function () {
  
  // ------------------------------------------
  // Define an Echo application class.
  // ------------------------------------------
  
  /**
   * @class
   * An implementation of Thywill.ApplicationInterface for the Echo
   * application.
   * 
   * @see Thywill.ApplicationInterface
   */
  var EchoApplication = function (applicationId) {
    Thywill.ApplicationInterface.call(this, applicationId);
    // For storing Handlebars.js templates.
    this.templates = {};  
  };
  jQuery.extend(EchoApplication.prototype, Thywill.ApplicationInterface.prototype);
  var p = EchoApplication.prototype;
  
  /**
   * Create the application user interface and its event listeners.
   */
  p.setupUI = function () { 
    var self = this;
    this.templates.uiTemplate = Handlebars.compile(jQuery("#{{{uiTemplateId}}}").html());
    this.templates.messageTemplate = Handlebars.compile(jQuery("#{{{messageTemplateId}}}").html());

    jQuery("body").append(this.templates.uiTemplate({
      title: "Thywill: Echo",
      buttonText: "Send"
    }));
    
    jQuery("#sender button").click(function () {
     var inputData = $("#sender textarea").val();  
     if (inputData) {
       // Thywill.Message(data, fromApplicationId, toApplicationId). Sending
       // this message to the server side of the same application.
       var message = new Thywill.Message(inputData, self.applicationId, self.applicationId);
       self.send(message);
       $("#sender textarea").val("");
     }
    });
    jQuery("#echo-wrapper").append('');
  };
  
  /**
   * Rudimentary logging.
   * 
   * @param {string} logThis
   *   String to log.
   */
  p.log = function (logThis) {
    console.log(logThis);
  };
  
  /**
   * @see Thywill.ApplicationInterface#received
   */
  p.received = function (message) {
    // Add the message content to the output div, and fade it in.
    var rendered = this.templates.messageTemplate(message);
    jQuery(rendered).hide().appendTo("#echo-output").fadeIn();
  },
  
  /**
   * @see Thywill.ApplicationInterface#connectionFailure
   */
  p.connectionFailure = function () {
    
    
    // TODO: something UI.

    this.log("Client failed to connect to the server.");
  };
  
  /**
   * @see Thywill.ApplicationInterface#disconnected
   */  
  p.disconnected = function () {
    
    
    
    // TODO: something UI.
    
    
    this.log("Client disconnected.");
  };
  
  /**
   * @see Thywill.ApplicationInterface#reconnected
   */   
  p.reconnected = function () {
    
    
    
    
    // TODO: something UI.
    
    
    this.log("Client reconnected.");
  };
  
  // ----------------------------------------------------------
  // Create an application instance and set up ready callbacks.
  // ----------------------------------------------------------
  
  // Create the application instance. The application ID will be populated 
  // by the backend via the Handlebars template engine when this Javascript
  // file is prepared as a resource.
  var app = new EchoApplication("{{{applicationId}}}");
  
  // Set a callback to be invoked when the Thywill bootstrap process is 
  // complete and applications can start to do their thing. That might complete
  // before the DOM is ready, so use jQuery.ready() to make sure we wait for
  // that.
  Thywill.addReadyCallback(function () {
    Thywill.ServerInterface.registerApplication(app);
    jQuery(document).ready(function () {
      app.setupUI();
    });
  });
})();
