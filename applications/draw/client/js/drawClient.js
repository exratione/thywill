/*global
  document: false,
  Handlebars: false,
  paper: false,
  Path: false,
  Tool: false,
  Thywill: false
*/
/**
 * @fileOverview
 * Client Javascript for the Draw application.
 */

(function () {

  // ------------------------------------------
  // Define a Draw application class.
  // ------------------------------------------

  /**
   * @class
   * An implementation of Thywill.ApplicationInterface for the Draw
   * application.
   *
   * @see Thywill.ApplicationInterface
   */
  function DrawApplication (applicationId) {
    Thywill.ApplicationInterface.call(this, applicationId);
    // For storing Handlebars.js templates.
    this.templates = {};
    // For storing paths displayed on the canvas.
    this.paths = {};
    this.lastPathId = 0;
  }
  Thywill.inherits(DrawApplication, Thywill.ApplicationInterface);
  var p = DrawApplication.prototype;

  // ------------------------------------------
  // User Interface Methods
  // ------------------------------------------

  /**
   * Create the application user interface and its event listeners.
   */
  p.uiSetup = function () {
    var self = this;

    // Populate the DOM from the template.
    this.templates.uiTemplate = Handlebars.compile(jQuery("#{{{uiTemplateId}}}").html());
    jQuery("body").append(this.templates.uiTemplate({
      title: "Thywill: Draw Application"
    }));

    // Add the Paper.js canvas.
    var canvas = jQuery("#canvas")[0];
    paper.setup(canvas);

    // A line drawing listener.
    this.lineTool = new paper.Tool();
  };

  /**
   * Make the UI disabled - no sending.
   */
  p.uiDisable = function () {
    // Remove handlers.
    delete this.lineTool.onMouseDown;
    delete this.lineTool.onMouseDrag;
    delete this.lineTool.onMouseUp;

    // Close off any current path.
    delete this.currentPath;
  };

  /**
   * Make the UI enabled and allow sending.
   */
  p.uiEnable = function () {
    var self = this;

    // Define handlers for creating paths.
    this.lineTool.onMouseDown = function (e) {
      self.currentPath = new paper.Path();
      self.currentPath.strokeColor = "black";
      self.currentPath.add(e.point);
      self.paths[self.lastPathId++] = self.currentPath;

      // TODO: set timer for removing path.

    };
    this.lineTool.onMouseDrag = function (e) {
      if (!self.currentPath) {
        return;
      }
      self.currentPath.add(e.point);

      // TODO: curtail the thing if it gets too big, start a new one.
    };
    this.lineTool.onMouseUp = function (e) {
      if (!self.currentPath) {
        return;
      }
      var path = self.currentPath;
      delete self.currentPath;
      // Get rid of the excess points in the path.
      path.simplify();

      // TODO: send path data to server.
    };
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
  // Create an application instance and set it up.
  // ----------------------------------------------------------

  // Create the application instance. The application ID will be populated
  // by the backend via the Handlebars template engine when this Javascript
  // file is prepared as a resource.
  var app = new DrawApplication("{{{applicationId}}}");

  // Initial UI setup.
  jQuery(document).ready(function () {
    app.uiSetup();
    Thywill.serverInterface.registerApplication(app);
  });

})();
