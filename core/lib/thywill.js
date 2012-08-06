/**
 * @fileOverview
 * Thywill class definition, the main controlling class for Thywill.
 */

var fs = require("fs");
var path = require("path");
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
  this.log = null;
  this.messageManager = null;
  this.minifier = null;
  this.resourceManager = null;
  this.templateEngine = null;
};
util.inherits(Thywill, Component);
var p = Thywill.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

/**
 * Template used to validate configuration.
 */
Thywill.CONFIG_TEMPLATE = {
  launch: {
    port: {
      _configInfo: {
        description: "Listen port if starting an Express server rather than using a provided server.",
        types: "integer",
        required: false
      }  
    },
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
 * @param {Object} [server]
 *   An http.Server or https.Server instance. If not provided, an HTTPServer will
 *   be created.
 * @param {Function} [callback] 
 *   Of the form function (error, thywill, server) {}, called on completion of
 *   setup, where thywill is the Thywill instance, server is a the Express
 *   server used, and error == null on success.
 */
Thywill.launch = function (config, applications, server, callback) {
  console.log("Beginning Thywill initialization and launch.");
  var self = this;
  // Create and configure the Thywill instance.
  var thywill = new Thywill();
  thywill.configureFromObject(config);
  
  // Check to see that there is a port defined if no server is provided, so 
  // that a default server can be created.
  if (!server && (!config.thywill.launch || !config.thywill.launch.port)) {
    throw new Error("Configuration passed to Thywill.launch() must include thywill.launch.port if no Express server is provided.");
  }
  
  if (!server) {
    thywill.providedServer = false;
    
    // Start up an HTTP server. Note that this will need sufficient privileges
    // to bind to a privileged port of < 1024. E.g. you are running the script
    // while logged in as root or through sudo via something like:
    // 
    // sudo /full/path/to/node /full/path/to/simpleExample.js
    //
    // Or more sensibly, you are using an init.d script.
    //
    console.log("No server provided: starting http.Server on port " + config.thywill.launch.port);
    server = http.createServer(function (req, res) {
      res.statusCode = 404;
      res.end("No such resource."); 
    });
    server.listen(config.thywill.launch.port);
    console.log("http.Server started.");
  }

  // Start thywill running. 
  //
  // We can either pass thywill.startup() a callback function that will be 
  // invoked when startup is complete, or we can listen for the "thywill.ready"
  // event elsewhere in our code. Here we are passing a callback.
  thywill.startup(server, applications, function (error) {
    // Drop the permissions of the process now that all ports are bound by
    // switching ownership to another user who still has sufficient permissions
    // to access the needed scripts.
    if (config.thywill.launch && config.thywill.launch.groupId) {
      process.setgid(config.thywill.launch.groupId);
    }
    if (config.thywill.launch && config.thywill.launch.userId) {
      process.setuid(config.thywill.launch.userId);
    }
    
    // Pass out the Thywill instance, the server, and any error message in the
    // callback.
    if (callback) {
      callback.call(self, error, thywill, server);
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
  var self = this;
  // Check the configuration with a dummy Thywill instance.
  var thywill = new Thywill();
  thywill.configureFromObject(config);
  
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
    callback.call(self, thywill.NO_ERRORS);
  });
  request.on("error", function (error) {
    console.log("Error on requesting preparation for shutdown: " + error);
    callback.call(self, error);
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
    if (!baseClasses[className]) {
      switch (className) {
        case "Component":
          baseClasses[className] = Component;
          break;
        case "Application":
        case "CacheManager":
        case "ClientInterface":
        case "Log":
        case "MessageManager":
        case "Minifier":
        case "ResourceManager":
        case "TemplateEngine":
          var pathElement = className.substr(0, 1).toLowerCase() + className.substr(1);
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
        default:
          throw new Error("No such base class: " + className);
      }
    }
    return baseClasses[className];
  };
} ());

//-----------------------------------------------------------
// Configuration - Synchronous Methods
//-----------------------------------------------------------

/** 
 * Configure this Thywill instance.
 *
 * @param {Object} obj 
 *   An object representation of configuration parameters.
 * @return {Object}
 *   The Thywill instance this function is called on.
 */
p.configureFromObject = function (obj) {
  if (!obj || !obj.thywill) {
    throw new Error("Thywill.configureFromObject: null, undefined, or incompete configuration object.");
  }
  this._checkConfiguration(obj.thywill);
  this.config = obj;
  return this;
};

/**
 * Configure this Thywill instance.
 * 
 * @param {string} json
 *   A JSON representation of configuration parameters.
 * @return {Object}
 *   The Thywill instance this function is called on.
 */
p.configureFromJSON = function (json) {
  return this.configureFromObject(JSON.parse(json));
};

/**
 * Configure this Thywill instance.
 * 
 * @param {string} [filepath]
 *   Path to a JSON configuration file.
 * @return {Object}
 *   The Thywill instance this function is called on.
 */
p.configureFromFile = function (filepath) {
  return this.configureFromJSON(fs.readFileSync(filepath, "utf-8"));
};

//-----------------------------------------------------------
// Startup - Asynchronous Methods
//-----------------------------------------------------------

/**
 * Start this thywill instance running: set up the configured components and 
 * then register applications.
 * 
 * @param {Object} server 
 *   An Express server object.
 * @param {Application|Application[]} applications 
 *   A single application or array of application objects to be registered.
 * @param {Function} [callback] 
 *   Of the form function (error) {}, where error == null on success.
 */
p.startup = function (server, applications, callback) {
  if (!this.config) {
    this.announceReady("Thywill.startup(): not configured. Use one of the configuration functions before calling startup()."); 
    return;
  }
  
  var self = this; 
  this.readyCallback = callback;
  this.server = server;
  this._setupAdminInterfaceListener();
  this._initializeComponents(applications, this.config, function (error) {
    self._announceReady(error);
  });
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
    if (config.ipAddresses.indexOf(req.connection.remoteAddress) == -1) {
      res.statusCode = 500;
      res.end("No access permitted from: " + req.connection.remoteAddress);
      return;
    }
    if (req.url == config.paths.prepareForShutdown) {
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
  // Things are shut down in reverse order to the startup process.
  var self = this;
  var fns = [
    function (asyncCallback) {
      // If the http.Server instance was created by Thywill, shut it
      // down.
      if (!self.providedServer) {
        self.log.debug("Closing http.Server instance.");
        self.server.on("close", asyncCallback);
        self.server.close();
      }
    },        
    function (asyncCallback) {
      self.log.debug("Preparing clientInterface for shutdown.");
      self.clientInterface._prepareForShutdown(asyncCallback);
    },
    function (asyncCallback) {
      self.log.debug("Preparing minifier for shutdown.");
      self.minifier._prepareForShutdown(asyncCallback);
    },
    function (asyncCallback) {
      self.log.debug("Preparing templateEngine for shutdown.");
      self.templateEngine._prepareForShutdown(asyncCallback);
    },
    function (asyncCallback) {
      self.log.debug("Preparing messageManager for shutdown.");
      self.messageManager._prepareForShutdown(asyncCallback);
    },
    function (asyncCallback) {
      self.log.debug("Preparing resourceManager for shutdown.");
      self.resourceManager._prepareForShutdown(asyncCallback);
    },
    function (asyncCallback) {
      self.log.debug("Preparing cacheManager for shutdown.");
      self.cacheManager._prepareForShutdown(asyncCallback);
    },
    function (asyncCallback) {
      self.log.debug("Preparing log for shutdown.");
      self.log._prepareForShutdown(asyncCallback);
    },
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
 * @param {Object} config 
 *   An object representation of configuration data.
 * @param {Function} callback 
 *   Of the form function (error), where error == null on success.
 */
p._initializeComponents = function (passedApplications, config, callback) {
  var self = this;
  var fns = [
    function (asyncCallback) {
      self._initializeComponent("log", config, asyncCallback);      
    },
    function (asyncCallback) {
      self._initializeComponent("cacheManager", config, asyncCallback);      
    },
    function (asyncCallback) {
      self._initializeComponent("resourceManager", config, asyncCallback);      
    },
    function (asyncCallback) {
      self._initializeComponent("messageManager", config, asyncCallback);      
    },
    function (asyncCallback) {
      self._initializeComponent("templateEngine", config, asyncCallback);      
    },
    function (asyncCallback) {
      self._initializeComponent("minifier", config, asyncCallback);      
    },
    function (asyncCallback) {
      self._initializeComponent("clientInterface", config, asyncCallback);      
    },
  ];
  
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
 *   Of the form function (error), where error == null on success.
 */
p._registerApplication = function (application, callback) {
  application.thywill = this;
  this.applications[application.id] = application;
  // all of the above is synchronous (for now), so invoke the callback;
  callback.call(this);
};

/**
 * Create and initialize a component, and return the singleton instance of that component.
 * 
 * @param {string} componentType 
 *   The type of the component.
 * @param {Object} config 
 *   An object representation of configuration.
 * @param {Function} callback 
 *   Of the form function (error), where error == null on success.
 */
p._initializeComponent = function (componentType, config, callback) {
  // Maintain only a single instance of each component.
  if (this[componentType]) {
    return this[componentType];
  }
  
  // If there is no instance configured, then set it up. But do we have the
  // necessary configuration?
  if (!config[componentType] || typeof config[componentType].implementation != "object") {
    callback.call(this, "Thywill._initializeComponent: missing " + componentType + " component definition in configuration."); 
    return;
  }

  // There are two types of definition, core and package. Core looks like:
  //
  // implementation: {
  //   type: "core",
  //   name: "someImplementationName"
  // }
  //
  // Package looks like this:
  //
  // implementation: {
  //   type: "core",
  //   name: "somePackageName",
  //   property: "optionalProperty"
  // }
  //
  var implementation = config[componentType].implementation;
  var ComponentConstructor = null;
  if (implementation.type == "core") {
    // Loading a constructor for a core component implementation.
    var componentPath = "./component/" + componentType + "/" + implementation.name + "/" + implementation.name;
    try {
      require.resolve(componentPath);
    } catch (e) {
      callback.call(this, "Thywill._initializeComponent: unsupported core component implementation '" + implementation.name + "' of type '" + componentType + "'");
      return;
    }
    ComponentConstructor = require(componentPath);
  } else if (implementation.type == "package") {
    // Loading a constructor for a component implementation provided by another package.
    try {
      require.resolve(implementation.name);
    } catch (e) {
      callback.call(this, "Thywill._initializeComponent: missing component implementation package '" + implementation.name + "' of type '" + componentType + "'");
      return;
    }
    // Optionally, the constructor is in a property of this package export.
    var exported = require(implementation.name);
    if (implementation.property) {
      ComponentConstructor = exported[property];  
    } else {
      ComponentConstructor = exported;
    }
  } else {
    callback.call(this, "Thywill._initializeComponent: invalid implementation type '" + implementation.type + "' for " + componentType + " component definition."); 
    return;
  }
  
  // Did we get a function? I hope so.
  if (typeof ComponentConstructor != "function") {
    callback.call(this, "Thywill._initializeComponent: component implementation definition for " + componentType + " did not yield a constructor function");
    return; 
  }
  
  // Now create the component, finally.
  this[componentType] = new ComponentConstructor();
  
  // Check the configuration: this will throw errors, unlike most of 
  // thywill's setup.
  this[componentType]._checkConfiguration(config[componentType]);
  
  // Note that the returned instance may not yet be finished with its 
  // configuration. When the component is done and ready for use, it will emit
  // an event and the callback function will be invoked.
  this[componentType]._configure(this, config[componentType], callback);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Thywill;
