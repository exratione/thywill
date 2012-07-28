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
 * 
 * There are other configuration methods if you'd like to use JSON, an object,
 * or a file at a specific path.
 */
function Thywill() {
  Thywill.super_.call(this, null);  
  this.componentType = "thywill";
  this.server = null;
  
  // Components.
  this.applications = {};
  this.clientInterface = null;
  this.log = null;
  this.datastore = null;
  this.template = null;
  this.resources = null;
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
  prepareForShutdown: {
    port: {
      _configInfo: {
         description: "The port to listen on for HTTP shutdown requests from localhost.",
         types: "integer",
         required: true
       } 
    },
    path: {
      _configInfo: {
         description: "The full path that an HTTP shutdown request must hit. e.g. '/thywill/prepareForShutdown'",
         types: "string",
         required: true
       } 
    }
  }
};

//-----------------------------------------------------------
//"Static" methods
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
 *   A single application or array of application objects to be registered.
 * @param {Object} [server]
 *   An HTTPServer or HTTPSServer instance. If not provided, an HTTPServer will
 *   be created.
 * @param {Function} [callback] 
 *   Of the form function (thywill, server, error) {}, called on completion of
 *   setup, where thywill is the Thywill instance, server is a the Express
 *   server used, and error == null on success.
 */
Thywill.launch = function (config, applications, server, callback) {

  // Create and configure the Thywill instance.
  var thywill = new Thywill();
  thywill.configureFromObject(config);
  
  // Check to see that there is a port defined if no server is provided, so 
  // that a default server can be created.
  if (!server && (!config.thywill.launch || !config.thywill.launch.port)) {
    throw new Error("Configuration passed to Thywill.launch() must include thywill.launch.port if no Express server is provided.");
  }
  
  if (!server) {
    // Start up an HTTP server. Note that this will need sufficient privileges
    // to bind to a privileged port of < 1024. E.g. you are running the script
    // while logged in as root or through sudo via something like:
    // 
    // sudo /full/path/to/node /full/path/to/simpleExample.js
    //
    // Or more sensibly, you are using an init.d script.
    //
    server = http.createServer(function (req, res) {
      res.statusCode = 404;
      res.end("No such resource."); 
    });
    server.listen(config.thywill.launch.port);
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
      callback.call(this, thywill, server, error);
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
 */
Thywill.prepareForShutdown = function (config) {
  // Check the configuration with a dummy Thywill instance.
  var thywill = new Thywill();
  thywill.configureFromObject(config);
  
  // Now go on to send a request to what is hopefully a running Thywill
  // instance and tell it to prepare for impending shutdown.
  console.log("Instructing Thywill to prepare for shutdown");
  
  var options = {
    host: "localhost",
    port: config.thywill.prepareForShutdown.port,
    path: config.thywill.prepareForShutdown.path,
    method: "HEAD"
  };
  
  var request = http.request(options, function (response) {
    console.log("Thywill completed preparations for shutdown");
  });
  request.end();
  request.on("error", function (error) {
    throw error;
  });
};

//-----------------------------------------------------------
// Configuration - Synchronous Methods
//-----------------------------------------------------------

/** 
 * Configure this Thywill instance.
 * 
 * The expected section of the global configuration object pertaining to the
 * Thywill class has the following format:
 * 
 * {
 *   "prepareForShutdown": {
 *     "port": 10080,
 *     "path": "/thywill/prepareForShutdown"
 *   }
 * }
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
  if (!filepath) {
    filepath = path.resolve(__dirname, "../config/thywill.json");
  }
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
  this._setupShutdownListener();
  this._initializeComponents(applications, this.config, function (error) {
    self._announceReady(error);
  });
};

/**
 * Set up a new server to listen for shutdown preparation messages
 * from localhost.
 * 
 * TODO: accept from other IP addresses.
 */
p._setupShutdownListener = function () {
  var self = this;
  var server = http.createServer();
  server.listen(this.config.thywill.prepareForShutdown.port);
  server.on("request", function (req, res) {
    if (req.connection.remoteAddress == "127.0.0.1" && req.url == this.config.thywill.prepareForShutdown.path) {
      self._managePreparationForShutdown(function () {
        // Don't complete the connection until the preparation is done.
        res.statusCode = 200;
        res.end();
      });
    } else {
      res.statusCode = 500;
      res.end();
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
      self.clientInterface._prepareForShutdown(asyncCallback);      
    },
    function (asyncCallback) {
      self.template._prepareForShutdown(asyncCallback);      
    },
    function (asyncCallback) {
      self.datastore._prepareForShutdown(asyncCallback);   
    },
    function (asyncCallback) {
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
 * datastore
 * template 
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
      self._initializeComponent("datastore", config, asyncCallback);      
    },
    function (asyncCallback) {
      self._initializeComponent("template", config, asyncCallback);      
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
            application._defineClientResources(innerAsyncCallback);
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
  
  // If there is no instance configured, then set it up.
  if (!config[componentType] || !config[componentType].component) {
    callback.call(this, "Thywill._initializeComponent: missing " + componentType + " component definition in configuration."); 
    return;
  }

  var componentPath = "./component/" + componentType + "/" + config[componentType].component + "/" + config[componentType].component;
  try {
    require.resolve(componentPath);
  } catch (e) {
    callback.call(this, "Thywill._initializeComponent: unsupported component '" + config[componentType].component + "' of type '" + componentType + "'");
    return;
  }
  var ComponentConstructor = require(componentPath);
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