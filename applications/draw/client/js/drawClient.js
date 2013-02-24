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
    jQuery("#canvas").removeClass("enabled");

    // Remove handlers.
    delete this.lineTool.onMouseDown;
    delete this.lineTool.onMouseDrag;
    delete this.lineTool.onMouseUp;

    // Close off any current path.
    this.finishCurrentPath();
  };

  /**
   * Make the UI enabled and allow sending.
   */
  p.uiEnable = function () {
    var self = this;

    // Define handlers for creating paths.
    this.lineTool.onMouseDown = function (e) {
      self.startNewCurrentPath();
      self.currentPath.add(e.point);
    };
    this.lineTool.onMouseDrag = function (e) {
      if (!self.currentPath) {
        return;
      }
      self.currentPath.add(e.point);
    };
    this.lineTool.onMouseUp = function (e) {
      self.finishCurrentPath();
    };

    jQuery("#canvas").addClass("enabled");
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
    // Draw a new path from the data.
    var path = this.createPath();
    var segments = message.data.segments.map(function (segmentData, index, array) {
      // The segment encodes information about curves as well as location.
      var segment = new paper.Segment();
      segment.setPoint(segmentData.point);
      segment.setHandleIn(segmentData.handleIn);
      segment.setHandleOut(segmentData.handleOut);
      return segment;
    });
    path.addSegments(segments);
    this.setPathForRemoval(path);
    paper.view.draw();
  };

  /**
   * Create a new Path instance.
   *
   * @return {Path}
   *   The newly created Path instance.
   */
  p.createPath = function () {
    var path = new paper.Path();
    path.strokeColor = "black";
    return path;
  };

  /**
   * Set a path to be removed after an interval.
   *
   * @param {Path} path
   *   A path instance.
   */
  p.setPathForRemoval = function (path) {
    setTimeout(function () {
      path.remove();
      paper.view.draw();
    }, 30000);
  };

  /**
   * Start a new current path that the user is drawing.
   */
  p.startNewCurrentPath = function () {
    // There should be no old path, but just in case there is, finish it.
    this.finishCurrentPath();
    this.currentPath = this.createPath();
  };

  /**
   * Finish the path currently being drawn.
   */
  p.finishCurrentPath = function () {
    if (!this.currentPath) {
      return;
    }
    var path = this.currentPath;
    delete this.currentPath;
    // Get rid of the excess points in the path, cut down what's going to
    // the server.
    path.simplify();
    this.setPathForRemoval(path);
    this.sendPath(path);
  };

  /**
   * Send data describing a paper.js path object to the server.
   *
   * @param {Paper.Path} path
   *   A Path instance.
   */
  p.sendPath = function (path) {
    var segments = path.getSegments();
    var data = {};
    data.segments = segments.map(function (segment, index, array) {
      // The segment encodes information about curves as well as location.
      var point = segment.getPoint();
      var handleIn = segment.getHandleIn();
      var handleOut = segment.getHandleOut();
      return {
        point: {
          x: point.x,
          y: point.y
        },
        handleIn: {
          x: handleIn.x,
          y: handleIn.y
        },
        handleOut: {
          x: handleOut.x,
          y: handleOut.y
        }
      };
    });
    this.send(data);
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
