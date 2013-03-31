/*global
  dateFormat: false,
  document: false,
  Handlebars: false,
  Thywill: false
*/
/**
 * @fileOverview
 * Client Javascript for the Display application.
 */

(function () {

  // ------------------------------------------
  // Define a Display application class.
  // ------------------------------------------

  /**
   * @class
   * An implementation of Thywill.ApplicationInterface for the Display
   * application.
   *
   * @see Thywill.ApplicationInterface
   */
  function DisplayApplication (applicationId) {
    Thywill.ApplicationInterface.call(this, applicationId);
    // For storing Handlebars.js templates.
    this.templates = {};
  }
  Thywill.inherits(DisplayApplication, Thywill.ApplicationInterface);
  var p = DisplayApplication.prototype;

  // ------------------------------------------
  // User Interface Methods
  // ------------------------------------------

  /**
   * Create the application user interface and its event listeners.
   */
  p.uiSetup = function () {
    var self = this;
    // Populate the DOM from the template. Note the values inserted when
    // this client-side Javascript file is itself run through the template
    // engine.
    this.templates.uiTemplate = Handlebars.compile(jQuery("#{{{uiTemplateId}}}").html());
    this.templates.textTemplate = Handlebars.compile(jQuery("#{{{textTemplateId}}}").html());
    this.templates.connectionTemplate = Handlebars.compile(jQuery("#{{{connectionTemplateId}}}").html());
    jQuery("body").append(this.templates.uiTemplate({
      // Putting this in as JSON.parse rather than just the plain JSON at least
      // means the IDE doesn't flag it as an error.
      clusterMembers: JSON.parse('{{{clusterMembers}}}'),
      title: "Thywill: Display Application"
    }));
  };

  /**
   * Make the UI disabled.
   */
  p.uiDisable = function () {
    // Remove all of the displayed data.
    var data = jQuery(".cluster-member ul").children();
    data.fadeOut("fast", function () {
      data.remove();
    });
  };

  /**
   * Make the UI enabled and allow sending.
   */
  p.uiEnable = function () {
    // Not needed.
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

  /**
   * Add a new message to the UI.
   *
   * @param {string} clusterMemberId
   *   ID of the cluster member that originated the message.
   * @param {string} text
   *   Text of the message.
   */
  p.displayMessage = function(clusterMemberId, text) {
    var messages = jQuery("#" + clusterMemberId + " .messages");
    var html = this.templates.textTemplate({
      timestamp: dateFormat(Date.now(), "HH:MM:ss"),
      text: text
    });
    // Convert to DOM. The filter("*") gets rid of newline text nodes, which
    // cause jQuery issues.
    html = jQuery.parseHTML(html);
    jQuery(html).filter("*").hide().appendTo(messages).slideDown("fast", function () {
      messages.scrollTop(messages.height());
    });
  };

  /**
   * Show new connections in the UI.
   *
   * @param {string} clusterMemberId
   *   ID of the cluster member that the client connected to.
   * @param {array} connectionIds
   *   Array of connection IDs.
   */
  p.displayConnections = function (clusterMemberId, connectionIds) {
    var self = this;
    var connections = jQuery("#" + clusterMemberId + " .connections");
    var html = connectionIds.map(function (connectionId, index, array) {
      return self.templates.connectionTemplate({
        connectionId: connectionId
      });
    }).join("\n");
    // Convert to DOM. The filter("*") gets rid of newline text nodes, which
    // cause jQuery issues.
    html = jQuery.parseHTML(html);
    jQuery(html).filter("*").hide().appendTo("#" + clusterMemberId + " .connections").slideDown("fast", function () {
      connections.scrollTop(connections.height());
    });
  };

  /**
   * Remove connections from the UI.
   *
   * @param {string} clusterMemberId
   *   ID of the cluster member that the clients connected to.
   * @param {array} connectionIds
   *   Array of connection IDs.
   */
  p.removeConnections = function(clusterMemberId, connectionIds) {
    var selector = connectionIds.map(function (connectionId, index, array) {
      return "#" + connectionId;
    }).join(", ");
    var selected = jQuery(selector);
    selected.fadeOut("fast", function () {
      selected.remove();
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
    var data = message.getData();
    var clusterMemberId;

    switch (data.type) {
      case "connection":
        this.displayMessage(data.clusterMemberId, data.connectionId + " connected.");
        this.displayConnections(data.clusterMemberId, [data.connectionId]);
        break;
      case "connectionList":
        for (clusterMemberId in data.connections) {
          this.displayConnections(clusterMemberId, data.connections[clusterMemberId]);
        }
        break;
      case "disconnection":
        this.displayMessage(data.clusterMemberId, data.connectionId + " disconnected.");
        this.removeConnections(data.clusterMemberId, [data.connectionId]);
        break;
      case "disconnectionList":
        for (clusterMemberId in data.connections) {
          this.removeConnections(clusterMemberId, data.connections[clusterMemberId]);
        }
        break;
      case "text":
        this.displayMessage(data.clusterMemberId, data.text);
        break;
    }
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
  var app = new DisplayApplication("{{{applicationId}}}");

  // Initial UI setup.
  jQuery(document).ready(function () {
    app.uiSetup();
    Thywill.serverInterface.registerApplication(app);
  });

})();
