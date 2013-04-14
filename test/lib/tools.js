/**
 * @fileOverview
 * Various utility functions for testing Thywill.
 */

var childProcess = require("child_process");
var path = require("path");
var http = require("http");
var async = require("async");
var vows = require("vows");
var assert = require("assert");
var clone = require("clone");
var express = require("express");
var redis = require("redis");
var Client = require("work-already").Client;
var MemorySocketStore = require("socket.io/lib/stores/memory");
var RedisSocketStore = require("socket.io/lib/stores/redis");
var RedisSessionStore = require("connect-redis")(express);
var MemorySessionStore = require("connect/lib/middleware/session/memory");
var Thywill = require("thywill");
var Message = Thywill.getBaseClass("Message");


// ------------------------------------------------------------
// Relating to setting up headless Thywill instances without
// applications running in this process.
// ------------------------------------------------------------

exports.headless = {};

/**
 * Utility function to create a client for a local Redis server.
 * @return {object}
 *   A Redis client.
 */
function createRedisClient () {
  var options = {};
  var client = redis.createClient(6379, "127.0.0.1", options);

  // This is fairly hacky, but needed to exercise the protection code. Create
  // a dummy Thywill instance, stick a dummy log into it, and run the protect
  // function on the client.
  var thywill = new Thywill();
  thywill.log = {
    debug: function (message) {
      console.log(message);
    },
    info: function (message) {
      console.log(message);
    },
    warn: function (message) {
      console.log(message);
    },
    error: function (message) {
      console.log(message);
    }
  };
  thywill.protectRedisClient(client);
  return client;
}

/**
 * Set up the config to start a Thywill server, based on the options provided.
 *
 * @param {Object} baseConfig
 *   The base configuration object, lacking any class instances, etc.
 * @param {Object} options
 *   The various options.
 * @return {Object}
 *   A cloned configuration object.
 */
function setupConfig (baseConfig, options) {
  var config = clone(baseConfig);

  // Create some Redis clients, if needed.
  var redisClients;
  function setupRedisClients () {
    if (!redisClients) {
      redisClients = {
        pub: createRedisClient(),
        sub: createRedisClient(),
        other: createRedisClient()
      };
    }
  }

  // ------------------------------------------------------------
  // Set up server.
  // ------------------------------------------------------------

  var port = config.thywill.ports[options.localClusterMemberId];

  // If using Express, set it up.
  if (config.clientInterface.implementation.name === "socketIoExpressClientInterface") {
    // Create servers.
    var app = express();
    config.clientInterface.server.app = app;
    var server = http.createServer(app).listen(port);
    config.clientInterface.server.server = server;

    // Create a session store.
    if (options.useRedisSessionStore) {
      setupRedisClients();
      config.clientInterface.sessions.store = new RedisSessionStore({
        client: redisClients.other
      });
    } else {
      config.clientInterface.sessions.store = new MemorySessionStore();
    }

    // Add minimal configuration to the Express application: just the cookie and
    // session middleware.
    app.use(express.cookieParser(config.clientInterface.sessions.cookieSecret));
    app.use(express.session({
      cookie: {
        httpOnly: true
      },
      key: config.clientInterface.sessions.cookieKey,
      secret: config.clientInterface.sessions.cookieSecret,
      store: config.clientInterface.sessions.store
    }));

    // Middleware and routes might be added here or after Thywill launches. Either
    // way is just fine and won't interfere with Thywill's use of Express to serve
    // resources. e.g. adding a catch-all here is acceptable:
    app.all("*", function (req, res, next) {
      res.statusCode = 404;
      res.send("No such resource.");
    });
  }
  // Not using Express, so a vanilla http.Server with no session management is
  // set up.
  else {
    config.clientInterface.server.server = http.createServer().listen(port);
  }

  // ------------------------------------------------------------
  // Set up Socket.IO store.
  // ------------------------------------------------------------

  // Are we using Redis?
  if (options.useRedisSocketStore) {
    // Create a RedisStore for Socket.IO.
    setupRedisClients();
    config.clientInterface.socketConfig.global.store = new RedisSocketStore({
      redisPub: redisClients.pub,
      redisSub: redisClients.sub,
      redisClient: redisClients.other
    });
  } else {
    // Create a MemoryStore for Socket.IO.
    config.clientInterface.socketConfig.global.store = new MemorySocketStore();
  }

  // ------------------------------------------------------------
  // Set up cluster.
  // ------------------------------------------------------------

  config.cluster.localClusterMemberId = options.localClusterMemberId;
  if (config.cluster.implementation.name === "redisCluster") {
    setupRedisClients();
    config.cluster.communication.publishRedisClient = redisClients.pub;
    config.cluster.communication.subscribeRedisClient = redisClients.sub;
  }

  // ------------------------------------------------------------
  // Set up resourceManager.
  // ------------------------------------------------------------

  if (config.resourceManager.implementation.name === "redisResourceManager") {
    setupRedisClients();
    config.resourceManager.redisClient = redisClients.other;
  }

  // ------------------------------------------------------------
  // Set up channelManager.
  // ------------------------------------------------------------

  if (config.channelManager && config.channelManager.implementation.name === "redisChannelManager") {
    setupRedisClients();
    config.channelManager.redisClient = redisClients.other;
  }

  return config;
}

/**
 * Add a batch to a Vows suite that launches a Thywill instance without any
 * applications.
 *
 * @param {Object} suite
 *   A Vows test suite instance.
 * @param {Object} options
 *   The various options.
 */
exports.headless.addThywillLaunchBatch = function (suite, options) {
  suite.thywills = suite.thywills || [];

  // Config should have only clonable things in it - no class instances, etc.
  var config = setupConfig(options.config, options);

  suite.addBatch({
    "Launch Thywill": {
      topic: function () {
        Thywill.launch(config, null, this.callback);
      },
      "successful launch": function (error, thywill) {
        assert.isNull(error);
        suite.thywills.push(thywill);
        assert.isTrue(suite.thywills[0] instanceof Thywill);
      }
    }
  });
};

/**
 * Create a partially formed Vows suite that launches a Thywill instance
 * without any applications as the first batch. This all happens in the
 * local process.
 *
 * {
 *   // Thywill configuration, without any of the class instances filled in.
 *   config: object
 *   // Optionally name the local cluster member.
 *   localClusterMemberId: string
 *   // If true then Redis implementations are used for Socket.IO.
 *   UseRedisSocketStore: boolean
 *   // If true then Redis implementations are used for Express sessions.
 *   UseRedisSessionStore: boolean
 * }
 *
 * @param {string} name
 *   The test suite name.
 * @param {Object} options
 *   The various options.
 * @return {Object}
 *   A Vows suite.
 */
exports.headless.singleInstanceVowsSuite = function (name, options) {
  var suite = vows.describe(name);
  options.localClusterMemberId = options.localClusterMemberId || "alpha";
  exports.headless.addThywillLaunchBatch(suite, options);
  return suite;
};

/**
 * Create a partially formed Vows suite that launches two Thywill instances
 * without any applications in the initial batches. This all happens in the
 * local process.
 *
 * @param {string} name
 *   The test suite name.
 * @param {Object} options
 *   The various options.
 * @return {Object}
 *   A Vows suite.
 */
exports.headless.clusterVowsSuite = function (name, options) {
  var suite = vows.describe(name);

  var optionsAlpha = clone(options);
  optionsAlpha.localClusterMemberId = "alpha";
  exports.headless.addThywillLaunchBatch(suite, optionsAlpha);

  var optionsBeta = clone(options);
  optionsBeta.localClusterMemberId = "beta";
  exports.headless.addThywillLaunchBatch(suite, optionsBeta);

  return suite;
};

/**
 * Add batches to a test suite.
 *
 * @param {Object} suite
 *   A Vows test suite instance.
 * @param {String} name
 *   The name of the file in this directory containing the batch-adding
 *   functions, for use in a require() call.
 * @param {String} property
 *   The property that will contain the batch-adding function.
 */
exports.headless.addBatches = function (suite, name, property) {
  var fn = require("./" + name)[property];
  fn(suite);
};

// ------------------------------------------------------------------------
// Related to testing against application child processes.
// ------------------------------------------------------------------------

// On the use of child processes to test the applications:
//
// This is done because there are odd issues with the use of the Redis-based
// Socket.IO store when running multiple Thywill servers in the same process.
// It is quicker to work around that with child processes for end-to-end web
// and socket tests than to head on down the rabbit hole of figuring out
// exactly what the problem is.
//
// This issue only impacts socket.io connections, and only with two or more
// Thywill instances in the same process. When trying to connect, the
// connection hangs, as the connection event is only emitted in the general
// namespace, not in the application namespace as it should be. Again, this
// only happens when two or more Thywill instances run in the same process.

exports.application = {};

/**
 * Launch one of the applications in a child process.
 *
 * Data has the form:
 *
 * {
 *   application: string
 *   port: number
 *   clusterMemberId: string
 * }
 *
 * @param {object} data
 * @param {Function} callback
 */
function launchApplicationInChildProcess (data, callback) {
  var args = JSON.stringify(data);
  args = new Buffer(args, "utf8").toString("base64");

  var child = childProcess.fork(
    path.join(__dirname, "launchApplicationInstance.js"),
    [args],
    {
      // Pass over all of the environment.
      env: process.ENV,
      // Share stdout.
      silent: false
    }
  );

  // Helper functions added to the child process instance.
  child.onUnexpectedExit = function (code, signal) {
    throw new Error("Child process running application terminated with code: " + code);
  };
  child.shutdown = function () {
    this.removeListener("exit", this.onUnexpectedExit);
    this.kill("SIGTERM");
  };

  // Make sure the child process dies along with this parent process insofar
  // as is possible. SIGTERM listener shouldn't be needed here for Vows test
  // processes, but leave it in anyway.
  process.on("SIGTERM", function () {
    child.shutdown();
  });
  process.on("exit", function () {
    child.shutdown();
  });
  // Kind of ugly. TODO: replace with Domains or something better.
  process.once("uncaughtException", function (error) {
    child.shutdown();
    throw error;
  });

  // If the child process dies, then we have a problem.
  child.on("exit", child.onUnexpectedExit);

  // Listen for one message from the application child process - used to wait
  // for its Thywill startup to be done.
  child.once("message", function (message) {
    if (message === "complete") {
      callback(null, child);
    } else {
      callback(message);
    }
  });
}

/**
 * Obtain a Vows suite in which the first batches involve launching one or
 * more child processes running one of the example applications, and then
 * starting up work-already package clients - but not actually connecting
 * via Socket.IO.
 *
 * @see exports.application.vowsSuite
 */
exports.application.vowsSuitePendingConnections = function (name, applicationName, pageMatches, processData) {
  var suite = vows.describe(name);
  if (!Array.isArray(processData)) {
    processData = [processData];
  }

  // Add batches to launch the child processes.
  processData.forEach(function (data, index, array) {
    data.application = applicationName;
    var batchContent = {
      topic: function () {
        launchApplicationInChildProcess(data, this.callback);
      },
      "child process launched": function (error, child) {
        assert.isNull(error);
        assert.isObject(child);
        suite.childProcesses = suite.childProcesses || [];
        suite.childProcessData = suite.childProcessData || [];
        suite.childProcesses.push(child);
        suite.childProcessData.push(data);
      }
    };
    var batchName = "Launch application: " + applicationName + " port: " + data.port + " clusterMemberId: " + data.clusterMemberId;
    var batch = {};
    batch[batchName] = batchContent;
    suite.addBatch(batch);
  });

  // Add batches to set up work-already clients and get them connected via
  // Socket.IO to these child process Thywill instances.
  processData.forEach(function (data, index, array) {
    var batchContent, batchName, batch;
    // 1) Create client.
    batchContent = {
      topic: function () {
        return new Client({
          server: {
            host: "localhost",
            port: data.port,
            protocol: "http"
          },
          sockets: {
            defaultNamespace: "/" + applicationName,
            defaultTimeout: 1000
          }
        });
      },
      "client created": function (client) {
        suite.clients = suite.clients || [];
        suite.clients[index] = client;
      }
    };
    batchName = "Create work-already client for clusterMemberId: " + data.clusterMemberId;
    batch = {};
    batch[batchName] = batchContent;
    suite.addBatch(batch);

    // 2) Get application page.
    batchContent = {
      topic: function () {
        suite.clients[index].action("/" + applicationName + "/", this.callback);
      },
      "page fetched": function (error, page) {
        assert.isNull(error);
        assert.isObject(page);
        assert.strictEqual(page.statusCode, 200);
        assert.isString(page.body);
        pageMatches.forEach(function (pageMatch, index, array) {
          assert.include(page.body, pageMatch);
        });
      }
    };
    batchName = "Load application page from clusterMemberId: " + data.clusterMemberId;
    batch = {};
    batch[batchName] = batchContent;
    suite.addBatch(batch);
  });

  return suite;
};

/**
 * Obtain a Vows suite in which the first batches involve launching one or
 * more child processes running one of the example applications, and then
 * starting up work-already package clients and connecting via Socket.IO.
 *
 * The processData has the form:
 *
 * [
 *   {
 *     port: 10078,
 *     clusterMemberId: "alpha"
 *   },
 *   {
 *     port: 10079,
 *     clusterMemberId: "beta"
 *   },
 *   ...
 * ]
 *
 * @param {string} name
 *   The Vows suite name.
 * @param {string} applicationName
 *   The application name.
 * @param {array} pageMatches
 *   Strings to check for in the application page.
 * @param {array} processData
 *   Data on the process to be launched.
 * @return {object}
 *   A Vows suite.
 */
exports.application.vowsSuite = function(name, applicationName, pageMatches, processData) {
  var suite = exports.application.vowsSuitePendingConnections(name, applicationName, pageMatches, processData);
  // Add batches to connect via Socket.IO.
  processData.forEach(function (data, index, array) {
    var batchContent = {
      topic: function () {
        suite.clients[index].action({
          type: "connect",
          socketConfig: {
            "resource": applicationName + "/socket.io"
          }
        }, this.callback);
      },
      "connected": function (error, page) {
        var client = suite.clients[index];
        assert.isNull(error);
        assert.isObject(client.page.sockets);
        assert.isObject(client.page.sockets[client.config.sockets.defaultNamespace]);
      }
    };
    var batchName = "Connect via Socket.IO to clusterMemberId: " + data.clusterMemberId;
    var batch = {};
    batch[batchName] = batchContent;
    suite.addBatch(batch);
  });

  return suite;
};

/**
 * Add a batch to ensure that work-already clients are shut down and child
 * application processes go away, regardless of how the rest of the tests
 * progress.
 *
 * @param {object} suite
 *   A Vows test suite instance.
 */
exports.application.closeVowsSuite = function (suite) {
  suite.addBatch({
    "Close clients": {
      topic: function () {
        if (Array.isArray(suite.clients) && suite.clients.length) {
          async.forEach(suite.clients, function (client, asyncCallback) {
            client.action({ type: "unload" }, asyncCallback);
          }, this.callback);
        } else {
          this.callback();
        }
      },
      "clients unloaded": function (error) {
        assert.typeOf(error, "undefined");
      }
    }
  });
  suite.addBatch({
    "Shut down application child processes": {
      topic: function () {
        if (Array.isArray(suite.childProcesses)) {
          suite.childProcesses.forEach(function (child, index, array) {
            // Use the helper method we added to the child.
            child.shutdown();
          });
        }
        return true;
      },
      "shutdown complete": function () {}
    }
  });
};

/**
 * Send a message to a child process Thywill instance, and wait for a response,
 * either on that instance or another instance.
 *
 * Options has the form:
 *
 * {
 *   // Which application this involves.
 *   applicationId: string,
 *   // Which Thywill instance / client instance to use for sending.
 *   sendIndex: number,
 *   // Which Thywill instance / client instance expects the response
 *   responseIndex: number,
 *   // The Message instance or message data to send.
 *   sendMessage: mixed,
 *   // The Message instance or message data expected in the response.
 *   responseMessage: mixed
 * }
 *
 * @param {string} batchName
 *   Name of the batch.
 * @param {object} suite
 *   A Vows test suite instance.
 * @param {object} options
 *   The rest of the needed parameters.
 */
exports.application.addSendAndAwaitResponseBatch = function (batchName, suite, options) {
  var batch = {};
  var definition = {
    topic: function () {
      suite.clients[options.responseIndex].action({
        type: "awaitEmit",
        eventType: "toClient"
      }, this.callback);

      var message = exports.wrapAsMessage(options.sendMessage);
      suite.clients[options.sendIndex].action({
        type: "emit",
        args: ["fromClient", options.applicationId, message]
      }, function (error) {});
    },
    "expected response": function (error, socketEvent) {
      assert.isNull(error);
      assert.isObject(socketEvent);
      var args = [
        options.applicationId,
        exports.wrapAsMessage(options.responseMessage).toObject()
      ];
      assert.deepEqual(socketEvent.args, args);
    }
  };
  batch[batchName] = definition;
  suite.addBatch(batch);
};

// ------------------------------------------------
// Utilities.
// ------------------------------------------------

/**
 * For associating RPC messages and responses.
 */
exports.rpcMessageId = 0;

/**
 * Create an RPC Message instance. Data has the form:
 *
 * {
 *   // Name of the remote function.
 *   name: string
 *   // Does the remote function have a callback?
 *   cb: boolean
 *   // Arguments for the function, lacking the final callback.
 *   args: array
 * }
 *
 * @param {object} data
 *   Data for the message.
 * @return {Message}
 *   A Message instance.
 */
exports.createRpcMessage = function (data) {
  var rpcId = exports.rpcMessageId++;
  var sendData = {
    id: rpcId,
    name: data.name,
    cb: data.hasCallback,
    args: data.args
  };
  var message = new Message(sendData);
  message.setType(Message.TYPES.RPC);
  return message;
};

/**
 * Create a response message of the sort returned by an RPC call.
 *
 * @param {mixed} id
 *   Must match the ID of the sent RPC message.
 * @param {array} args
 *   Returned arguments as for a callback with leading null if successful.
 * @return {Message}
 *   A Message instance.
 */
exports.createRpcResponseMessage = function (id, args) {
  var message = new Message({
    id: id,
    cbArgs: args
  });
  message.setType(Message.TYPES.RPC);
  return message;
};

/**
 * Ensure message data is wrapped in a Message instance.
 *
 * @param {mixed|Message} message
 *   The message data.
 */
exports.wrapAsMessage = function (message) {
  if (!(message instanceof Message)) {
    message = new Message(message);
  }
  return message;
};

/**
 * Add a batch that does nothing but delay.
 *
 * @param {object} suite
 *   A Vows suite.
 * @param {number} delay
 *   Delay in milliseconds.
 */
exports.addDelayBatch = function (suite, delay) {
  var batchContents = {
    topic: function () {
      setTimeout(this.callback, delay);
    },
    "delayed": function () {}
  };
  var batchName = "Delay by " + delay + "ms";
  var batch = {};
  batch[batchName] = batchContents;
  suite.addBatch(batch);
};
