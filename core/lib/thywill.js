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
    if (process.platform !== "win32") {
      if (thywill.config.thywill.process && thywill.config.thywill.process.groupId) {
        process.setgid(thywill.config.thywill.process.groupId);
      }
      if (thywill.config.thywill.process && thywill.config.thywill.process.userId) {
        process.setuid(thywill.config.thywill.process.userId);
      }
    }

    // Pass the Thywill instance and any error message in the callback.
    if (callback) {
      callback(error, thywill);
    }
  });
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
        // Core classes under /core/lib/component.
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
        default:
          // Look for classes under /extra/lib/component.
          try {
            pathElement = className.substr(0, 1).toLowerCase() + className.substr(1);
            baseClasses[className] = require("../../extra/lib/component/application/" + pathElement);
            if (typeof baseClasses[className] !== "function") {
              throw new Error();
            }
          } catch (e) {
            // Out of luck, found nothing.
            throw new Error("No such base class: " + className);
          }
          break;
      }
    }
    return baseClasses[className];
  };
} ());

//-----------------------------------------------------------
// Utility methods
//-----------------------------------------------------------

/**
 * Redis clients from the "redis" package can emit "end" events and then
 * silently block on all future method calls. This happens if the Redis server
 * has a client timeout set, but can happen intermittently even without that
 * being the case. The Redis client should reconnect, but sometimes doesn't -
 * it just hangs. Hopefully this will be fixed and this function can go away
 * in the future. See:
 *
 * http://www.exratione.com/2013/01/nodejs-connections-will-end-close-and-otherwise-blow-up/
 *
 * This function ensures that a Redis client will be replaced if this happens.
 *
 * @param {RedisClient} client
 *   A RedisClient instances from the "redis" package.
 */
p.protectRedisClient = function (client) {
  if (client.protectedByThywill) {
    return;
  } else {
    client.protectedByThywill = true;
  }

  // Replacement wrappers for client functions, used to keep track of the
  // subscriptions without relying on existing client internals.
  var psubscribe = function () {
    for (var i = 0, l = arguments.length; i < l; i++) {
      if (typeof arguments[i] === "string") {
        this._psubscriptions[arguments[i]] = true;
      }
    }
    this._psubscribe.apply(this, arguments);
  };
  var punsubscribe = function () {
    for (var i = 0, l = arguments.length; i < l; i++) {
      if (typeof arguments[i] === "string") {
        delete this._psubscriptions[arguments[i]];
      }
    }
    this._punsubscribe.apply(this, arguments);
  };
  var subscribe = function () {
    for (var i = 0, l = arguments.length; i < l; i++) {
      if (typeof arguments[i] === "string") {
        this._subscriptions[arguments[i]] = true;
      }
    }
    this._subscribe.apply(this, arguments);
  };
  var unsubscribe = function () {
    for (var i = 0, l = arguments.length; i < l; i++) {
      if (typeof arguments[i] === "string") {
        delete this._subscriptions[arguments[i]];
      }
    }
    this._unsubscribe.apply(this, arguments);
  };

  // Keep track of subscriptions/unsubscriptions ourselves, rather than
  // rely on existing client internals.
  client._psubscriptions = {};
  client._subscriptions = {};

  // Put the replacement functions in place.
  client._psubscribe = client.psubscribe;
  client.psubscribe = psubscribe;
  client._punsubscribe = client.punsubscribe;
  client.punsubscribe = punsubscribe;
  client._subscribe = client.subscribe;
  client.subscribe = subscribe;
  client._unsubscribe = client.unsubscribe;
  client.unsubscribe = unsubscribe;

  var self = this;
  var redis = require("redis");
  function replace (client) {
    var subscriptions = Object.keys(client._subscriptions);
    var psubscriptions = Object.keys(client._psubscriptions);
    // Ensure that all connection handles are definitely closed.
    client.closing = true;
    client.end();
    client = redis.createClient(client.port, client.host, client.options);
    self.protectRedisClient(client);

    // Resubscribe where needed.
    if (subscriptions.length) {
      self.log.debug("Resubscribing Redis client:" + subscriptions);
      client.subscribe.apply(client, subscriptions);
    }
    if (psubscriptions.length) {
      self.log.debug("Resubscribing Redis client to patterns:" + subscriptions);
      client.psubscribe.apply(client, psubscriptions);
    }
  }
  client.once("end", function () {
    self.log.debug("Replacing Redis connection on end.");
    replace(client);
  });
};

/**
 * Obtain the process uid that will be used after Thywill setup is complete.
 * For example, it might be the case that Thywill is launched as root to bind
 * to privileged ports and then downgraded on completion of setup.
 */
p.getFinalUid = function () {
  if (process.platform === "win32") {
    return undefined;
  }

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
p.getFinalGid = function () {
  if (process.platform === "win32") {
    return undefined;
  }

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
  // Don't try this on windows, as it's specific to *nix systems.
  if (process.platform === "win32") {
    callback();
    return;
  }

  var self = this;
  var fns = [];

  if (this.config.thywill.process && this.config.thywill.process.userId) {
    if (typeof this.config.thywill.process.userId === "string") {
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
    if (typeof this.config.thywill.process.groupId === "string") {
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
 * Initialize the components and register applications in the necessary order.
 * Later components may thereby make use of earlier ones in their
 * initialization. The order is:
 *
 * log
 * cluster
 * cacheManager
 * resourceManager
 * messageManager
 * templateEngine
 * minifier
 * clientInterface  - which needs to know about all the resources
 * /extra components
 * applications     - which set various resources
 *
 * @param {Application[]} passedApplications
 *   Array of object instances of classes derived from Application.
 * @param {Function} callback
 *   Of the form function (error), where error === null on success.
 */
p._initializeComponents = function (passedApplications, callback) {
  var self = this;
  // Most of this method builds up this array of functions to be called at the
  // end via async.series().
  var fns = [];

  // Core components have to be initialized in this order.
  var coreComponentNames = [
    "log",
    "cluster",
    "cacheManager",
    "resourceManager",
    "messageManager",
    "templateEngine",
    "minifier",
    "clientInterface"
  ];

  // Are any additional non-core components defined in the configuration?
  var extraComponentNames = Object.keys(this.config).filter(function (name, index, array) {
    if (name === "thywill" || coreComponentNames.indexOf(name) !== -1) {
      return false;
    }
    // See if this has looks like a component definition.
    try {
      if (typeof self.config[name].implementation.type === "string") {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  });

  // The list of all components to be initialized.
  var componentNames = coreComponentNames.concat(extraComponentNames);
  // Add a component initialization function to the array.
  var initializeComponents = function (asyncCallback) {
    async.forEachSeries(componentNames, function (name, innerAsyncCallback) {
      self._initializeComponent(name, innerAsyncCallback);
    }, asyncCallback);
  };
  fns.push(initializeComponents);

  /**
   * A convenience function for initializing applications.
   */
  var initializeApplication = function (application, callback) {
    var fns = [
      function (asyncCallback) {
        self._registerApplication(application, asyncCallback);
      },
      function (asyncCallback) {
        application._defineBootstrapResources(asyncCallback);
      },
      function (asyncCallback) {
        application._setup(asyncCallback);
      },
      function (asyncCallback) {
        application._setupListeners(asyncCallback);
      }
    ];
    async.series(fns, callback);
  };

  // If we have applications, add a function to initialize them to the array.
  if (passedApplications) {
    if (!Array.isArray(passedApplications)) {
      passedApplications = [passedApplications];
    }
    var initializeApplications = function (callback) {
      async.forEach(passedApplications, function (application, asyncCallback) {
        initializeApplication(application, asyncCallback);
      }, callback);
    };
    fns.push(initializeApplications);
  }

  // Add a function to start up the clientInterface implementation.
  fns.push(function (asyncCallback) {
    self.clientInterface._startup(asyncCallback);
  });

  // Call the array of functions in order, each starting after the prior has
  // finished.
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
