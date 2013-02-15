/**
 * @fileOverview
 * Thywill class definition, the main controlling class for Thywill.
 */

var exec = require('child_process').exec;
var fs = require("fs");
var util = require("util");
var async = require("async");
var http = require("http");

var Component = require("./component/component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The main controlling class for thywill.
 *
 * See the service scripts in /applications/[appName]/service/start.js for
 * examples of use.
 */
function Thywill() {
  Thywill.super_.call(this);
  this.componentType = "thywill";
  this.server = null;
  this.adminInterfaceServer = null;

  // Was this Thywill instance provided with an http.Server (true) or did it
  // create a default http.Server as a part of launch and configuration
  // (false)?
  this.providedServer = true;

  // Components.
  this.applications = {};
  this.cacheManager = null;
  this.clientInterface = null;
  this.cluster = null;
  this.log = null;
  this.messageManager = null;
  this.minifier = null;
  this.resourceManager = null;
  this.templateEngine = null;
}
util.inherits(Thywill, Component);
var p = Thywill.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

/**
 * Template used to validate configuration.
 */
Thywill.CONFIG_TEMPLATE = {
  process: {
    groupId: {
      _configInfo: {
        description: "The group name or ID to own the Node process after startup.",
        types: "string",
        required: false
      }
    },
    userId: {
      _configInfo: {
        description: "The user name or ID to own the Node process after startup.",
        types: "string",
        required: false
      }
    }
  },
  adminInterface: {
    ipAddresses: {
      _configInfo: {
        description: "IP addresses permitted to connect to the administrative interface.",
        types: "array",
        required: true
      }
    },
    paths: {
      prepareForShutdown: {
        _configInfo: {
          description: "The full path that an HTTP shutdown request must hit. e.g. '/thywill/prepareForShutdown'",
          types: "string",
          required: true
        }
      }
    },
    port: {
      _configInfo: {
        description: "The port to listen on.",
        types: "integer",
        required: true
      }
    }
  }
};

//-----------------------------------------------------------
// "Static" methods
//-----------------------------------------------------------

/**
 * Launch a Thywill server.
 *
 * This is intended to be called from a startup script. See the Thywill
 * documentation for more information on how to set up Thywill as a service.
 *
 * @param {Object} config
 *   An object representation of configuration.
 * @param {Application|Application[]} applications
 *   A single Application or array of Application instances to be registered.
 * @param {Function} [callback]
 *   Of the form function (error, thywill, server) {}, called on completion of
 *   setup, where thywill is the Thywill instance, server is a the Express
 *   server used, and error === null on success.
 */
Thywill.launch = function (config, applications, callback) {
  // Create and configure the Thywill instance.
  var thywill = new Thywill();

  if (!config || !config.thywill) {
    throw new Error("Null, undefined, or incomplete configuration object.");
  }
  thywill._checkConfiguration(config.thywill);
  thywill.config = config;

  // Start thywill running.
  //
  // We can either pass thywill.startup() a callback function that will be
  // invoked when startup is complete, or we can listen for the "thywill.ready"
  // event elsewhere in our code. Here we are passing a callback.
  thywill.startup(applications, function (error) {
    // Drop the permissions of the process now that all ports are bound by
    // switching ownership to another user who still has sufficient permissions
    // to access the needed scripts.
    if (thywill.config.thywill.process && thywill.config.thywill.process.groupId) {
      process.setgid(thywill.config.thywill.process.groupId);
    }
    if (thywill.config.thywill.process && thywill.config.thywill.process.userId) {
      process.setuid(thywill.config.thywill.process.userId);
    }

    // Pass the Thywill instance and any error message in the callback.
    if (callback) {
      callback(error, thywill);
    }
  });
};

/**
 * Tell a Thywill server to gracefully prepare for shutdown, but do not end
 * the process.
 *
 * This is intended to be called from a shutdown script. See the Thywill
 * documentation for more information on how to set up Thywill as a service.
 *
 * @param {Object} config
 *   An object representation of configuration.
 * @param {Function) callback
 *   Of the form
 */
Thywill.prepareForShutdown = function (config, callback) {
  // Check the configuration with a dummy Thywill instance.
  var thywill = new Thywill();
  if (!config || !config.thywill) {
    throw new Error("Null, undefined, or incomplete configuration object.");
  }
  thywill._checkConfiguration(config.thywill);

  // Now go on to send a request to what is hopefully a running Thywill
  // instance and tell it to prepare for impending shutdown.
  console.log("Instructing Thywill to prepare for shutdown.");

  var options = {
    host: "localhost",
    port: config.thywill.adminInterface.port,
    path: config.thywill.adminInterface.paths.prepareForShutdown,
    method: "GET"
  };
  var request = http.request(options, function (response) {
    console.log("Thywill has completed preparations for shutdown.");
    callback(thywill.NO_ERRORS);
  });
  request.on("error", function (error) {
    console.error(error);
    callback(error);
  });
  request.end();
};

/**
 * Obtain one of the Thywill base class constructors.
 *
 * Various base classes must be easily available as a result of using
 * require("thywill"), so that other packages can build on them. We can't
 * just attach them to the Thywill constructor because the base class
 * definitions also have require("thywill") in them - that would create
 * circular references.
 *
 * So instead, allow loading through this function.
 *
 * @param {string} className
 *   The name of a Thywill base class.
 */
Thywill.getBaseClass = (function () {
  // Encapsulate this object and return an accessor. The various class
  // constructors will be stored here, out of sight.
  var baseClasses = {};
  // Accessor function for the encapsulated object.
  return function (className) {
    var pathElement;
    if (!baseClasses[className]) {
      switch (className) {
        // Core classes.
        case "Component":
          baseClasses[className] = Component;
          break;
        case "Application":
        case "CacheManager":
        case "ClientInterface":
        case "Cluster":
        case "Log":
        case "MessageManager":
        case "Minifier":
        case "ResourceManager":
        case "TemplateEngine":
          pathElement = className.substr(0, 1).toLowerCase() + className.substr(1);
          baseClasses[className] = require("./component/" + pathElement + "/" + pathElement);
          break;
        case "Cache":
          baseClasses[className] = require("./component/cacheManager/cache");
          break;
        case "Message":
          baseClasses[className] = require("./component/messageManager/message");
          break;
        case "Resource":
          baseClasses[className] = require("./component/resourceManager/resource");
          break;
        // Extra classes.
        case "RpcCapableApplication":
          pathElement = className.substr(0, 1).toLowerCase() + className.substr(1);
          baseClasses[className] = require("../../extra/lib/component/application/" + pathElement);
          break;
        case "EmberStore":
          pathElement = className.substr(0, 1).toLowerCase() + className.substr(1);
          baseClasses[className] = require("../../extra/lib/component/" + pathElement + "/" + pathElement);
          break;
        // Out of luck, found nothing.
        default:
          throw new Error("No such base class: " + className);
      }
    }
    return baseClasses[className];
  };
} ());

//-----------------------------------------------------------
// Utility methods
//-----------------------------------------------------------

/**
 * Obtain the process uid that will be used after Thywill setup is complete.
 * For example, it might be the case that Thywill is launched as root to bind
 * to privileged ports and then downgraded on completion of setup.
 */
p.getFinalUid = function() {
  if (this.config.thywill.process && this.config.thywill.process.userId) {
    return this.config.thywill.process.numericUserId;
  } else {
    return process.getuid();
  }
};

/**
 * Obtain the process gid that will be used after Thywill setup is complete.
 * For example, it might be the case that Thywill is launched as root to bind
 * to privileged ports and then downgraded on completion of setup.
 */
p.getFinalGid = function() {
  if (this.config.thywill.process && this.config.thywill.process.groupId) {
    return this.config.thywill.process.numericGroupId;
  } else {
    return process.getgid();
  }
};

//-----------------------------------------------------------
// Startup methods
//-----------------------------------------------------------

/**
 * Start this thywill instance running: set up the configured components and
 * then register applications.
 *
 * @param {Application|Application[]} applications
 *   A single application or array of application objects to be registered.
 * @param {Function} [callback]
 *   Of the form function (error) {}, where error === null on success.
 */
p.startup = function (applications, callback) {
  if (!this.config) {
    this.announceReady(new Error("Thywill not configured. Use Thywill.launch(config, application, callback) to create and launch a Thywill instance."));
    return;
  }

  var self = this;
  this.readyCallback = callback;
  this._setupAdminInterfaceListener();
  var fns = [
    // Convert uid and gid names in configuration to numeric ids.
    function (asyncCallback) {
      self._convertUserIdAndGroupId(asyncCallback);
    },
    // Run through the component initialization.
    function (asyncCallback) {
      self._initializeComponents(applications, asyncCallback);
    }
  ];
  async.series(fns, function (error) {
    self._announceReady(error);
  });
};

/**
 * The process userId and groupId set in configuration can be string usernames
 * or numeric user IDs, which can be inconvenient later on. So here we convert
 * them to numeric user IDs.
 */
p._convertUserIdAndGroupId = function (callback) {
  var self = this;
  var fns = [];

  if (this.config.thywill.process && this.config.thywill.process.userId) {
    if (typeof this.config.thywill.launch.userId === "string") {
      fns.push(function (asyncCallback) {
        var childProcess = exec("id -u " + self.config.thywill.process.userId, function (error, stdoutBuffer, stderrBuffer) {
          var response = stdoutBuffer.toString().trim();
          if (/^\d+$/.test(response)) {
            self.config.thywill.process.numericUserId = parseInt(response, 10);
          }
          asyncCallback(error);
        });
      });
    }
  }
  if (this.config.thywill.process && this.config.thywill.process.groupId) {
    if (typeof this.config.thywill.launch.groupId === "string") {
      fns.push(function (asyncCallback) {
        var childProcess = exec("id -u " + self.config.thywill.process.groupId, function (error, stdoutBuffer, stderrBuffer) {
          var response = stdoutBuffer.toString().trim();
          if (/^\d+$/.test(response)) {
            self.config.thywill.process.numericGroupId = parseInt(response, 10);
          }
          asyncCallback(error);
        });
      });
    }
  }

  async.series(fns, callback);
};

/**
 * Set up a new server to listen for shutdown preparation messages
 * from localhost.
 */
p._setupAdminInterfaceListener = function () {
  var self = this;
  var config = this.config.thywill.adminInterface;
  this.adminInterfaceServer = http.createServer();
  this.adminInterfaceServer.listen(config.port);

  // TODO: better admin responses, actual HTML.

  this.adminInterfaceServer.on("request", function (req, res) {
    if (config.ipAddresses.indexOf(req.connection.remoteAddress) === -1) {
      res.statusCode = 500;
      res.end("No access permitted from: " + req.connection.remoteAddress);
      return;
    }
    if (req.url === config.paths.prepareForShutdown) {
      self._managePreparationForShutdown(function () {
        // Don't complete the connection until the preparation is done.
        res.statusCode = 200;
        res.end("Prepared for shutdown.");
      });
    } else {
      res.statusCode = 500;
      res.end("Unknown admin function.");
    }
  });
};

/**
 * Perform all the cleanup and other operations needed prior to shutdown,
 * but do not actually shutdown. Call the callback function only when
 * these operations are actually complete.
 *
 * @param {Function} callback
 *   Called when preparations are complete.
 */
p._managePreparationForShutdown = function (callback) {
  // Don't try to prepare for shutdown more than once.
  if (this.preparedForShutdown) {
    callback(new Error("Already prepared for shutdown."));
    return;
  }
  this.preparedForShutdown = true;

  // Things are shut down in reverse order to the startup process.
  var self = this;
  var fns = [
    function (asyncCallback) {
      self.log.info("Preparing clientInterface for shutdown.");
      self.clientInterface._prepareForShutdown(asyncCallback);
    },
    function (asyncCallback) {
      self.log.info("Preparing minifier for shutdown.");
      self.minifier._prepareForShutdown(asyncCallback);
    },
    function (asyncCallback) {
      self.log.info("Preparing templateEngine for shutdown.");
      self.templateEngine._prepareForShutdown(asyncCallback);
    },
    function (asyncCallback) {
      self.log.info("Preparing messageManager for shutdown.");
      self.messageManager._prepareForShutdown(asyncCallback);
    },
    function (asyncCallback) {
      self.log.info("Preparing resourceManager for shutdown.");
      self.resourceManager._prepareForShutdown(asyncCallback);
    },
    function (asyncCallback) {
      self.log.info("Preparing cacheManager for shutdown.");
      self.cacheManager._prepareForShutdown(asyncCallback);
    },
    function (asyncCallback) {
      self.log.info("Preparing cluster for shutdown.");
      self.cluster._prepareForShutdown(asyncCallback);
    },
    function (asyncCallback) {
      self.log.info("Preparing log for shutdown.");
      self.log._prepareForShutdown(asyncCallback);
    }
  ];
  async.series(fns, callback);
};

/**
 * Initialize the components and register applications in the necessary order.
 * Later components may thereby make use of earlier ones in their
 * initialization. The order is:
 *
 * log
 * resourceManager
 * messageManager
 * template
 * minify
 * applications     - which set various resources
 * clientInterface  - which needs to know about all the resources
 *
 * @param {Application[]} passedApplications
 *   Array of object instances of classes derived from Application.
 * @param {Function} callback
 *   Of the form function (error), where error === null on success.
 */
p._initializeComponents = function (passedApplications, callback) {
  var self = this;
  var fns = [
    // Core components, have to be in order.
    function (asyncCallback) {
      self._initializeComponent("log", asyncCallback);
    },
    function (asyncCallback) {
      self._initializeComponent("cluster", asyncCallback);
    },
    function (asyncCallback) {
      self._initializeComponent("cacheManager", asyncCallback);
    },
    function (asyncCallback) {
      self._initializeComponent("resourceManager", asyncCallback);
    },
    function (asyncCallback) {
      self._initializeComponent("messageManager", asyncCallback);
    },
    function (asyncCallback) {
      self._initializeComponent("templateEngine", asyncCallback);
    },
    function (asyncCallback) {
      self._initializeComponent("minifier", asyncCallback);
    },
    function (asyncCallback) {
      self._initializeComponent("clientInterface", asyncCallback);
    }
  ];

  // Are any extra components defined in the configuration?
  var extraComponents = ["emberStore"];
  extraComponents.forEach(function (extraComponent, index, array) {
    if (self.config[extraComponent]) {
      fns.push(function (asyncCallback) {
        self._initializeComponent(extraComponent, asyncCallback);
      });
    }
  });

  // Add two loops through the applications array, if we have one, to
  // the list of functions to call.
  if (passedApplications) {
    if (!(passedApplications instanceof Array)) {
      passedApplications = [passedApplications];
    }
    fns.push(
      function (asyncCallback) {
        async.forEach(
          passedApplications,
          function (application, innerAsyncCallback) {
            self._registerApplication(application, innerAsyncCallback);
          },
          asyncCallback
        );
      }
    );
    fns.push(
      function (asyncCallback) {
        async.forEach(
          passedApplications,
          function (application, innerAsyncCallback) {
            application._defineBootstrapResources(innerAsyncCallback);
          },
          asyncCallback
        );
      }
    );
  }

  // Finish by starting up the clientInterface, which will process all the
  // resources defined so far.
  fns.push(function (asyncCallback) {
    self.clientInterface._startup(asyncCallback);
  });

  // Call the array of functions in order, each starting after the prior has
  // finished, and invoke the original callback function at the end.
  async.series(fns, callback);
};

/**
 * Sort out the various details for an application; called during setup.
 *
 * @param {Application} application
 *   An application instance.
 * @param {Function} callback
 *   Of the form function (error), where error === null on success.
 */
p._registerApplication = function (application, callback) {
  application.thywill = this;
  this.applications[application.id] = application;
  // all of the above is synchronous (for now), so invoke the callback;
  callback();
};

/**
 * Create and initialize a component, and return the singleton instance of that component.
 *
 * @param {string} componentType
 *   The type of the component.
 * @param {Function} callback
 *   Of the form function (error), where error === null on success.
 */
p._initializeComponent = function (componentType, callback) {
  // Maintain only a single instance of each component.
  if (this[componentType]) {
    return this[componentType];
  }

  // If there is no instance configured, then set it up. But do we have the
  // necessary configuration?
  if (!this.config[componentType] || typeof this.config[componentType].implementation !== "object") {
    callback(new Error("Missing " + componentType + " component definition in configuration."));
    return;
  }

  // There are three types of definition, core, extra, and require. Core looks like:
  //
  // implementation: {
  //   type: "core",
  //   name: "someImplementationName"
  // }
  //
  // Extra looks like:
  //
  // implementation: {
  //   type: "extra",
  //   name: "someImplementationName"
  // }
  //
  // Require looks like this:
  //
  // implementation: {
  //   type: "require",
  //   path: "some package name or path/to/desired/implementation",
  //   property: "optionalProperty"
  // }
  //
  var implementation = this.config[componentType].implementation,
      ComponentConstructor,
      componentPath;
  // Loading a constructor for a core component implementation.
  if (implementation.type === "core") {
    componentPath = "./component/" + componentType + "/" + implementation.name;
    try {
      require.resolve(componentPath);
    } catch (e) {
      callback(new Error("Unsupported core component implementation '" + implementation.name + "' of type '" + componentType + "'"));
      return;
    }
    ComponentConstructor = require(componentPath);
  }
  // Loading a constructor for an extra component implementation.
  else if (implementation.type === "extra") {
    componentPath = "../../extra/lib/component/" + componentType + "/" + implementation.name;
    try {
      require.resolve(componentPath);
    } catch (e) {
      callback(new Error("Unsupported extra component implementation '" + implementation.name + "' of type '" + componentType + "'"));
      return;
    }
    ComponentConstructor = require(componentPath);
  }
  // Loading a constructor for a component implementation provided by another package.
  else if (implementation.type === "require") {
    try {
      require.resolve(implementation.path);
    } catch (e) {
      callback(new Error("Missing require component implementation '" + implementation.path + "' of type '" + componentType + "'"));
      return;
    }
    // Optionally, the constructor is in a property of this package export.
    var exported = require(implementation.path);
    if (implementation.property) {
      ComponentConstructor = exported[implementation.property];
    } else {
      ComponentConstructor = exported;
    }
  }
  else {
    callback(new Error("Invalid implementation type '" + implementation.type + "' for " + componentType + " component definition."));
    return;
  }

  // Did we get a function? I hope so.
  if (typeof ComponentConstructor !== "function") {
    callback(new Error("Component implementation definition for " + componentType + " did not yield a constructor function."));
    return;
  }

  // Now create the component, finally.
  this[componentType] = new ComponentConstructor();

  // Check the configuration: this will throw errors, unlike most of
  // thywill's setup.
  this[componentType]._checkConfiguration(this.config[componentType]);

  // Note that the returned instance may not yet be finished with its
  // configuration. When the component is done and ready for use, it will emit
  // an event and the callback function will be invoked.
  this[componentType]._configure(this, this.config[componentType], callback);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Thywill;
