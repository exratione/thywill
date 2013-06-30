/*global
  Handlebars: false,
  Thywill: false
*/
/**
 * @fileOverview
 * Client Javascript for the Calculations application.
 */

(function () {
  "use strict";

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
      multiplyByTwo: {
        operationText: "* 2",
        rpc: {
          name: "multiplicative.multiplyByTwo",
          hasCallback: false
        }
      },
      divideByTwo: {
        operationText: "/ 2",
        rpc: {
          name: "multiplicative.divideByTwo",
          hasCallback: true
        }
      },
      square: {
        operationText: "^ 2",
        rpc: {
          name: "powers.square",
          hasCallback: false
        }
      },
      squareRoot: {
        operationText: "^ 0.5",
        rpc: {
          name: "powers.squareRoot",
          hasCallback: true
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
    // The user interface is contained in this one template.
    this.templates.uiTemplate = Handlebars.compile(jQuery("#{{{uiTemplateId}}}").html());
    // We'll need the operations definitions for rendering.
    var operations = Object.keys(this.operations).map(function (key, index, array) {
      self.operations[key].id = key;
      return self.operations[key];
    });
    // Render and display the template.
    jQuery("body").append(this.templates.uiTemplate({
      operations: operations
    }));
    // Add references to elements to the operations definitions.
    for (var key in this.operations) {
      this.operations[key].inputElement = jQuery("#" + key + " input");
      this.operations[key].resultElement = jQuery("#" + key + " .result");
    }
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
      var elem = jQuery(this);
      self.inputValueChanged(elem.attr("operation"), elem.val());
    });
  };

  /**
   * Display an error associated with an operation.
   */
  p.uiError = function (id, error) {
    var operation = this.operations[id];
    var speed = 100;

    switch (error) {
      case this.rpcErrors.DISCONNECTED:
        error = "Not connected.";
        break;
      case this.rpcErrors.NO_FUNCTION:
        error = "Missing server function.";
        break;
      case this.rpcErrors.NO_PERMISSION:
        error = "Access forbidden.";
        break;
      case this.rpcErrors.TIMED_OUT:
        error = "Timed out.";
        break;
      default:
    }

    operation.resultElement.fadeOut(speed, function () {
      operation.resultElement.addClass("result-error").html(error).fadeIn(speed);
    });
  };

  /**
   * Update the display of an operation result.
   *
   * @param {string} id
   *   Operation ID.
   * @param {string|number} result
   *   The result to display.
   */
  p.uiUpdateResult = function (id, result) {
    // NaN and Infinity come through the JSON as null. If this was a more
    // complete example, it might deal with complex numbers and so forth.
    // But it doesn't.
    if (result === null) {
      this.uiError(id, "Invalid calculation.");
      return;
    }

    if (typeof result === "number") {
      if (result % 1 === 0) {
        result = result.toFixed(0);
      } else {
        result = result.toFixed(4).replace(/0+$/, "");
      }
    }

    var operation = this.operations[id];
    var speed = 100;
    operation.resultElement.fadeOut(speed, function () {
      operation.resultElement.removeClass("result-error").html(result).fadeIn(speed);
    });
  };

  /**
   * Change the status message.
   */
  p.uiStatus = function (text, className) {
    var status = jQuery("#status");
    var speed = 100;
    status.fadeOut(speed, function () {
      status.html("[ " + text + " ]")
        .removeClass("connecting connected disconnected")
        .addClass(className)
        .fadeIn(speed);
    });
  };

  // ------------------------------------------
  // Other Methods
  // ------------------------------------------

  /**
   * An input value changed. Delay, then send an RPC to the server.
   *
   * @param {string} id
   *   The ID of the operation.
   * @param {string} value
   *   The current input value.
   */
  p.inputValueChanged = function (id, value) {
    var self = this;
    var operation = this.operations[id];
    // Using interval to set up a delay that we keep extending with each new
    // value change that happens before the delay completes.
    if (operation.intervalId) {
      clearInterval(operation.intervalId);
    }
    operation.intervalId = setInterval(function () {
      // Clear the interval - we only want the one function call.
      clearInterval(operation.intervalId);
      delete operation.intervalId;

      // Stash the value in an array of values. Do this to avoid oddball timing
      // issues relating to responses returning out of order.
      operation.pending = operation.pending || [];
      operation.pending.push(value);

      // Send the RPC.
      var data = {
        name: operation.rpc.name,
        hasCallback: operation.rpc.hasCallback,
        args: [parseFloat(value, 10)]
      };
      self.rpc(data, function (error, result) {
        if (error) {
          self.uiError(id, error);
        } else {
          // Only display this result if the value parameter is still the last submitted value parameter.
          var display = (operation.pending.length && operation.pending[operation.pending.length - 1] === value);
          // Remove from the pending list.
          operation.pending = operation.pending.filter(function (element, index, array) {
            return value !== element;
          });
          if (display) {
            self.uiUpdateResult(id, result);
          }
        }
      });
    }, 200);
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
  });

})();
