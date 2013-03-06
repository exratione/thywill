Thywill
=======

Thywill is a component framework for building single page web applications that
use secure asynchronous messaging to communicate between client and server.

Overview
--------

Thywill is a Node.js framework for building a particular type of single-page
web application:

  * Based on asynchronous messaging
  * All traffic is sent encrypted over SSL
  * Uses Socket.IO as a communication layer
  * Functionality can be exposed to clients progressively

In Thywill, messages are passed asynchronously between connected web clients
and the server, and can be initiated at any time by either the client or the
server. This will no doubt be familiar to anyone who has worked with
WebSockets or the other similar approaches to allow a web server to push data
to a client.

Noteworthy Features
-------------------

  * Attach to any http.Server instance - so use Thywill in conjunction with Express, for example
  * Optionally share sessions with Express
  * Minification of Javascript and CSS resources
  * EJS and Handlebars template engines are supported, others can be added
  * The client can issue remote procedure calls to server functions
  * Easy to set up clustered server processes
  * Component architecture for easy extension or replacement of core functionality
  * Example server configurations for running Thywill applications as a service
  * Example applications to demonstrate setup and usage

Example Applications
--------------------

You can manually run the simplest example Thywill application, Echo, as
follows:

    cd path/to/thywill
    node applications/echo/service/startEcho

Navigate to the following URL on your server to see it in action.

    http://example.com:10080/echo/

Then read /doc/applicationServiceSetup.md for instructions on how to set up a
Thywill application Node.js process as a service.

Go on to read /doc/serverSetup.md for instructions on how to set up a server
with an SSL-capable proxy so as to run a Thywill application securely via HTTPS
connections. With that built, you can access Echo as follows:

    https://example.com/echo/

Creating New Thywill Applications
---------------------------------

A Thywill application implements the necessary server and client interfaces to:

  * Send and receive messages through Thywill
  * Add Javascript, CSS, and other resources to be loaded by a client

The example applications found under /applications demonstrate how this is
accomplished by extending the Application class on the server and the
ApplicationInterface class on the client.

Beyond this minimum, a Thywill application can contain any arbitrary code. It
does its thing, while Thywill manages the message transport between server and
client.

Clustering
----------

If you want to scale to serve large numbers of concurrent client connections,
then at some point you have to start adding extra servers. Multiple Thywill
processes can run as a cluster and communicate with one another when set up
with a core cluster component implementation such as RedisCluster.

If using RedisCluster, the configuration object for each cluster process needs
to inform that process of (a) the list of cluster member IDs and (b) its own
cluster member ID. You might look at /applications/draw/lib/service.js for an
example:

    // The cluster implementation is backed by Redis.
    config.cluster = {
      implementation: {
        type: "core",
        name: "redisCluster"
      },
      // The cluster has four member processes.
      clusterMemberIds: ["alpha", "beta", "gamma", "delta"],
      // This is the alpha process.
      localClusterMemberId: "alpha",
      redisPrefix: "thywill:draw:cluster:",
      publishRedisClient: redis.createClient(6379, "127.0.0.1"),
      subscribeRedisClient: redis.createClient(6379, "127.0.0.1")
    };

It is easy to pass data between cluster members in your application. For
example, on application setup:

    /**
     * @see Application#_setup
     */
    MyApp.prototype._setup = function (callback) {
      // Listen for cluster task requests of this specific sort.
      this.thywill.cluster.on("myTaskType", function (taskData) {
        // Do something here.
      });
      callback();
    };

Then anywhere in your application code, you can send to other cluster processes:

    // Send to the beta process.
    this.thywill.cluster.sendTo("beta", "myTaskType", {
      // Task data goes here.
    });
    // Send to all of the other processes.
    this.thywill.cluster.sendToOthers(myTaskType", {
      // Task data goes here.
    });
    // Send to all processes, including this one.
    this.thywill.cluster.sendToAll(myTaskType", {
      // Task data goes here.
    });

Keeping Track of Current Connections
------------------------------------

A server-side Application instance is notified whenever a client connects or
disconnects, even if this happens in other processes in a cluster:

    // Invoked whenever a client connects to this process.
    Application.prototype.connection = function (connectionId, sessionId, session) {};
    // Invoked whenever a client connects to any process in the cluster.
    Application.prototype.connectionTo = function (clusterMemberId, connectionId, sessionId) {};
    // Invoked whenever a client disconnects from this process.
    Application.prototype.disconnection = function (connectionId, sessionId) {};
    // Invoked whenever a client disconnects from any process in the cluster.
    Application.prototype.disconnectionFrom = function (clusterMemberId, connectionId, sessionId) {};

There's also a notification for a mass disconnection on server failure - though
admittedly a lot of thought can go into exactly what should be done by the
application under that circumstance:

    // Invoked when a cluster member process fails, thus disconnecting all its
    // clients.
    Application.prototype.clusterMemberDown = function (clusterMemberId, connectionData) {};

The default core ClientInterface implementation keeps track of connected
clients, even in a clustered backend. In application code, for example, you
can call this method:

    // isConnected will be true if the client is connected to any of the
    // cluster processes.
    this.thywill.clientInterface.clientIsConnected(connectionId, function (error, isConnected) {
      if (isConnected) {
        console.log(connectionId + " is connected.");
      }
    });

The same thing works for sessions:

    // isConnected will be true if this session has one or more clients
    // connected to any of the cluster processes.
    this.thywill.clientInterface.sessionIsConnected(sessionId, function (error, isConnected) {
      if (isConnected) {
        console.log(sessionId + " is connected.");
      }
    });

You can also obtain all of the current connection data for all processes:

    this.thywill.clientInterface.getConnectionData(function (error, data) {
      // The data object may be a reference to locally used data, so treat it
      // carefully.
    });

Remote Procedure Calls
----------------------

An application can issue remote procedure calls to server functions if it
extends RpcCapableApplication on the server and RpcCapableApplicationInterface
on the client.

In the server code:

    function ExampleApplication (id) {
      ExampleApplication.super_.call(this, id);
      // Set up an example function in a namespace.
      this.rpcContext.exampleFunctions = {
        exampleFunction: function (count) {
          return count * 2;
        }
      };
    }
    util.inherits(ExampleApplication, Thywill.getBaseClass("RpcCapableApplication"));

In the client code:

    function ExampleApplicationInterface (applicationId) {
      Thywill.RpcCapableApplicationInterface.call(this, applicationId);
    }
    Thywill.inherits(ExampleApplicationInterface, Thywill.RpcCapableApplicationInterface);

Then to make a remote procedure call from the client:

    var data = {
      // Will look for this.rpcContext.exampleFunctions.exampleFunction in the
      // server Application instance context.
      name: "exampleFunctions.exampleFunction",
      // True if the server function is asynchronous and accepts a callback as
      // the last argument.
      hasCallback: false,
      // Arguments for the remote function, omitting the final callback
      // argument if it has one.
      args: [10]
    };
    exampleApplicationInterface.rpc(data, function (error, result) {
      // result === 20
      console.log(result);
    });

See the Calculations example application for a simple demonstration.

A Work in Progress
------------------

Thywill is very much a work in progress, proceeding at a sedate pace. It
remains skeletal at this time, with much to be done. Nonetheless, the core
functions - it is possible to write applications on top of Thywill, should
you so feel the urge.

You will want to read through the material in /doc, and if interested take
a look at the example applications in /applications.
