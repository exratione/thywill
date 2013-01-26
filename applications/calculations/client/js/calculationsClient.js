/*global
  Handlebars: false,
  Thywill: false
*/
/**
 * @fileOverview
 * Client Javascript for the Calculations application.
 */

(function () {

  // ------------------------------------------
  // Define an Echo application class.
  // ------------------------------------------

  /**
   * @class
   * An implementation of Thywill.ApplicationInterface for the Calculations
   * application.
   *
   * @see Thywill.ApplicationInterface
   */
  function CalculationsApplication (applicationId) {
    Thywill.RpcCapableApplicationInterface.call(this, applicationId);
    // For storing Handlebars.js templates.
    this.templates = {};
    // Data for the various operations shown on the page.
    this.operations = {
      square: {
        operationsText: "^ 2",
        rpc: {
          name: "multiplicative.square",
          hasCallback: false
        }
      }
    };

  }
  Thywill.inherits(CalculationsApplication, Thywill.RpcCapableApplicationInterface);
  var p = CalculationsApplication.prototype;

  // ------------------------------------------
  // User Interface Methods
  // ------------------------------------------

  /**
   * Create the application user interface and its event listeners.
   */
  p.uiSetup = function () {
    var self = this;
    // The user interface is all contained in this one template.
    this.templates.uiTemplate = Handlebars.compile(jQuery("#{{{uiTemplateId}}}").html());
    // We'll need the operations definitions for rendering.
    var operations = Object.keys(this.operations).map(function (key, index, array) {
      self.operations[key].id = key;
      return self.operations[key];
    });
    // Render and display the template.
    jQuery("body").append(this.templates.uiTemplate({
      title: "Thywill: Calculations Application",
      operations: operations
    }));
  };

  /**
   * Make the UI disabled - no operations can be carried out.
   */
  p.uiDisable = function () {
    jQuery("input").attr("disabled", true).removeClass("enabled").off("keyup");
  };

  /**
   * Make the UI enabled and allow operations.
   */
  p.uiEnable = function () {
    var self = this;
    // Enable the operations on data changing in the inputs.
    jQuery("input").removeAttr("disabled").addClass("enabled").on("keyup", function (e) {
      var parent = jQuery(this).parent();
      var id = parent.attr("id");
      var rpc = self.operations[id].rpc;
      var args = [parseInt(jQuery(this).val(), 10)];
      self.rpc(rpc.name, rpc.hasCallback, args, function (error, result) {
        if (error) {

        } else {
          parent.find(".result").html(result);
        }
      });
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
    // This application only uses RPC, so no other messages
    // should arrive here.
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
  var app = new CalculationsApplication("{{{applicationId}}}");

  // Initial UI setup.
  jQuery(document).ready(function () {
    app.uiSetup();
    Thywill.serverInterface.registerApplication(app);
  });

})();
