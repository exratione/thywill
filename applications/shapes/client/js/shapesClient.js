/*global
  Thywill: false
*/
/**
 * @fileOverview
 * Client Javascript for the Shapes application.
 */

(function () {

  // ------------------------------------------
  // Define an Echo application class.
  // ------------------------------------------

  /**
   * @class
   * An implementation of Thywill.EmberApplicationInterface for the Shapes
   * application.
   *
   * @see Thywill.ApplicationInterface
   */
  function ShapesApplication (applicationId) {
    Thywill.EmberApplicationInterface.call(this, applicationId);
    // For storing Handlebars.js templates.
    this.templates = {};
  }
  Thywill.inherits(ShapesApplication, Thywill.EmberApplicationInterface);
  var p = ShapesApplication.prototype;

  // ------------------------------------------
  // User Interface Methods
  // ------------------------------------------

  /**
   * Create the application user interface and its event listeners.
   */
  p.uiSetup = function () {
    var self = this;

  };

  /**
   * Make the UI disabled - no sending.
   */
  p.uiDisable = function () {

  };

  /**
   * Make the UI enabled and allow sending.
   */
  p.uiEnable = function () {

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
  // Create an application instance and set up ready callbacks.
  // ----------------------------------------------------------

  // Create the application instance. The application ID will be populated
  // by the backend via the Handlebars template engine when this Javascript
  // file is prepared as a resource.
  var app = new ShapesApplication("{{{applicationId}}}");

  // Initial UI setup.
  jQuery(document).ready(function () {
    app.uiSetup();
    Thywill.ServerInterface.registerApplication(app);
  });

})();
