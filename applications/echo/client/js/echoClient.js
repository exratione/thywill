/*global
  document: false,
  Handlebars: false,
  Thywill: false
*/
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
  function EchoApplication (applicationId) {
    Thywill.ApplicationInterface.call(this, applicationId);
    // For storing Handlebars.js templates.
    this.templates = {};
  }
  Thywill.inherits(EchoApplication, Thywill.ApplicationInterface);
  var p = EchoApplication.prototype;

  // ------------------------------------------
  // User Interface Methods
  // ------------------------------------------

  /**
   * Create the application user interface and its event listeners.
   */
  p.uiSetup = function () {
    this.templates.uiTemplate = Handlebars.compile(jQuery("#{{{uiTemplateId}}}").html());
    this.templates.messageTemplate = Handlebars.compile(jQuery("#{{{messageTemplateId}}}").html());

    jQuery("body").append(this.templates.uiTemplate({
      title: "Thywill: Echo Application",
      buttonText: "Send"
    }));

    jQuery("#sender textarea").focus();
    jQuery("#echo-wrapper").append('');
  };

  /**
   * Make the UI disabled - no sending.
   */
  p.uiDisable = function () {
    jQuery("#sender button").removeClass("enabled").off("click");
  };

  /**
   * Make the UI enabled and allow sending.
   */
  p.uiEnable = function () {
    var self = this;
    // Enable the button.
    jQuery("#sender button").addClass("enabled").on("click", function () {
      var textarea = jQuery("#sender textarea");
      var inputData = textarea.val();
      if (inputData) {
        // Sending this user-entered data as a message to the server side of the
        // this application.
        self.send(inputData);
        textarea.val("");
      }
    });
  };

  /**
   * Change the status message.
   */
  p.uiStatus = function (text, className) {
    var status = jQuery("#status");
    var speed = 100;
    status.fadeOut(speed, function () {
      status.html(text)
        .removeClass("connecting connected disconnected")
        .addClass(className)
        .fadeIn(speed);
    });
  };

  // ------------------------------------------
  // Other Methods
  // ------------------------------------------

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
    // Set scroll top, or else the new message might not push down content
    // correctly.
    jQuery("#echo-output").scrollTop(0);
    // Render the message HTML.
    var rendered = this.templates.messageTemplate({
      data: message.getData()
    });
    // Transform into DOM nodes - which requires that trim() or jQuery will be
    // confused by leading and trailing line feeds.
    rendered = jQuery.parseHTML(rendered.trim());
    // Add the message content to the output div, and slide it in.
    jQuery(rendered).hide().prependTo("#echo-output").slideDown();
  };

  /**
   * @see Thywill.ApplicationInterface#connecting
   */
  p.connecting = function () {
    this.uiStatus("Connecting...", "connecting");
    this.log("Client attempting to connect.");
  };

  /**
   * @see Thywill.ApplicationInterface#connected
   */
  p.connected = function () {
    this.uiStatus("Connected", "connected");
    this.uiEnable();
    this.log("Client connected.");
  };

  /**
   * @see Thywill.ApplicationInterface#connectionFailure
   */
  p.connectionFailure = function () {
    this.uiStatus("Disconnected", "disconnected");
    this.uiDisable();
    this.log("Client failed to connect.");
  };

  /**
   * @see Thywill.ApplicationInterface#disconnected
   */
  p.disconnected = function () {
    this.uiStatus("Disconnected", "disconnected");
    this.uiDisable();
    this.log("Client disconnected.");
  };

  // ----------------------------------------------------------
  // Create an application instance and set it up.
  // ----------------------------------------------------------

  // Create the application instance. The application ID will be populated
  // by the backend via the Handlebars template engine when this Javascript
  // file is prepared as a resource.
  var app = new EchoApplication("{{{applicationId}}}");

  // Initial UI setup.
  jQuery(document).ready(function () {
    app.uiSetup();
    Thywill.serverInterface.registerApplication(app);
  });

})();
