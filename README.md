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
  * Server processes can be clustered to support large numbers of connections

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
  * Easy to integrate client code with AngularJS, Ember, or other similar frameworks
  * The client can issue remote procedure calls to server functions
  * Easy to set up clustered server processes
  * Set up channels and keep tabs on current connections
  * Component architecture for easy extension or replacement of core functionality
  * Full example server configuration to run Thywill web applications as a service
  * Example applications to demonstrate setup, code organization, and usage

Example Applications
--------------------

You can install Thywill and manually run the simplest example application, Echo,
as follows:

    npm install thywill
    node node_modules/thywill/applications/echo/service/startEcho

Navigate to the following URL on your server to see it in action.

    http://example.com:10080/echo/

Then read /doc/applicationServiceSetup.md for instructions on how to set up a
service that runs a Thywill application Node.js process.

Go on to read /doc/serverSetup.md for instructions on how to set up a server
with an SSL-capable proxy so as to run a Thywill application securely via HTTPS
connections. With that built, you could access Echo as follows:

    https://example.com/echo/

Creating New Thywill Applications
---------------------------------

A Thywill application implements the necessary server and client interfaces to:

  * Send and receive messages through Thywill
  * Add Javascript, CSS, and other resources initially loaded by a client

The example applications found under /applications demonstrate how this is
accomplished by:

  * Inheriting from the Application class on the server
  * Inheriting from the ApplicationInterface class on the client
  * Writing a suitable main Thywill configuration file
  * Writing templates and CSS to define the user interface
  * Defining the manifest of resources for initial delivery to the client
  * Cloning and customizing a launch script

Beyond this minimum, a Thywill application can contain any arbitrary code. It
does its thing, while Thywill manages the message transport between server and
client.

Using Express With Thywill
--------------------------

When creating a Thywill application you don't have to define any more than the
resources initially loaded when a user visits the application page. You could
choose to set up the rest of your site, and other resources to be later loaded
by your Thywill application, outside of Thywill in your Express application
code.

This is the best way to manage integrating Thywill with a web site already
served by Express, for example, or with frameworks like AngularJS and Ember
which, it is assumed, are going to be doing a lot of REST API access. You can
let Thywill handle messaging, connection tracking, and the rest of its functions
while both Express and the client framework get on with their jobs.

Using AngularJS, Ember, or Other Frameworks With Thywill
--------------------------------------------------------

It's simple to use a front-end framework like AngularJS with Thywill. Just
create an ApplicationInterface class as usual, obtain a reference to it in
your framework code, and listen on it for events such as arriving messages.

For example, in an AngularJS controller you might do something like this:

    var thywillApp = Thywill.myApplicationInterfaceInstance;
    thywillApp.on('received', function (message) {
      $scope.messages.push(message);
    });
    $thywillApp.on('disconnected', function () {
      $scope.isConnected = false;
    })

The Tabular example application in /applications/tabular illustrates how to
create a Thywill-AngularJS integrated web application.

Sending Messages From Server to Client
--------------------------------------

In an Application class method, a message can be sent to a specific client
connection as follows:

    MyApplication.prototype.sendSomething = function (connectionId) {
      this.sendToConnection(connectionId, {
        // Data sent with the message goes here.
      });
    }

If you have a ClientTracker component enabled (see below), then you can also
send to all the connections associated with a particular session:

    MyApplication.prototype.sendSomething = function (sessionId) {
      this.sendToSession(sessionId, {
        // Data sent with the message goes here.
      });
    }

You can also subscribe connections to a channel and publish messages to that
channel:

    MyApplication.prototype.sendSomething = function (connectionId) {
      var channelId = 'someChannel';
      this.subscribe(connectionId, channelId, function (error) {
        if (error) {
          this.thywill.log.error(error);
        } else {
          // Send a message to everyone in the channel.
          this.sendToChannel(channelId, {
            // Data sent with the message goes here.
          });
        }
      });
    }

The connection will remain in the channel until unsubscribed or disconnected.
To persist subscriptions past a single connection, you must use the
ChannelManager component described in its own section below. That allows for
subscribing sessions to channels, such that each new connection associated with
the session is auto-subscribed.

Receiving Messages at the Client
--------------------------------

A child class of ApplicationInterface on the client side must implement the
received() method, as this is invoked whenever a message arrives from the
server:

    // Message is an instance of Thywill.Message.
    MyApplicationInterface.prototype.received = function (message) {
      // This obtains the data sent from the server.
      var data = message.getData();
    };

Sending Messages From the Client
--------------------------------

Sending a message back to the server Application implementation is just as
easy:

    MyApplicationInterface.prototype.sendSomething = function (data) {
      this.send(data);
    };

Receiving Messages at the Server
--------------------------------

A server Application class must implement the receivedFromClient() method,
as it is invoked whenever a message arrives from a client:

    // Client is an instance of the Client class.
    // Message is an instance of the Message class.
    MyApplication.prototype.receivedFromClient = function (client, message) {
      // Do something here.
    };

Clustering
----------

If you want to scale to serve large numbers of concurrent client connections,
then at some point you have to start adding extra servers. Multiple Thywill
processes can run as a cluster and communicate with one another when set up
with a core cluster component implementation such as RedisCluster or
HttpCluster.

The RedisCluster implementation uses Redis pub/sub for communication, and runs
a heartbeat and monitor in a separate process. Here is an example of the
RedisCluster configuration:

    // The cluster implementation is backed by Redis.
    config.cluster = {
      implementation: {
        type: 'core',
        name: 'redisCluster'
      },
      // The cluster has four member processes.
      clusterMemberIds: ['alpha', 'beta', 'gamma', 'delta'],
      communication: {
        publishRedisClient: createRedisClient(6379, '127.0.0.1'),
        subscribeRedisClient: createRedisClient(6379, '127.0.0.1')
      },
      heartbeat: {
        interval: 200,
        timeout: 500
      },
      // This is the alpha process.
      localClusterMemberId: 'alpha',
      redisPrefix: 'thywill:draw:cluster:'
    };

The HttpCluster implementation sets up its own web server per cluster member
and uses it for communication and status checks between cluster members. Here
is an example of the HttpCluster configuration:

    // The cluster implementation uses a web server for communication.
    config.cluster = {
      implementation: {
        type: 'core',
        name: 'httpCluster'
      },
      // The cluster has two member processes.
      clusterMembers: {
        'alpha': {
          host: '127.0.0.1',
          port: 20091
        },
        'beta': {
          host: '127.0.0.1',
          port: 20092
        }
      },
      upCheck: {
        // How many consecutive failures in order to consider a server down?
        consecutiveFailedChecks: 2,
        interval: 200,
        requestTimeout: 500
      },
      localClusterMemberId: 'alpha',
      taskRequestTimeout: 500
    };

It is easy to pass data between cluster members in your application. For
example, on application setup listen on the cluster for specific events:

    /**
     * @see Application#_setup
     */
    MyApp.prototype._setup = function (callback) {
      // Listen for cluster task requests of this specific sort.
      this.thywill.cluster.on('myTaskType', function (taskData) {
        // Do something here.
      });
      callback();
    };

Then anywhere in application class method code you can trigger that event in
other cluster processes:

    // Task data is any object.
    var taskData = {
      // Task data goes here.
    };
    // Send to the beta process.
    this.thywill.cluster.sendTo('beta', 'myTaskType', taskData);
    // Send to all of the other processes.
    this.thywill.cluster.sendToOthers('myTaskType', taskData);
    // Send to all processes, including this one.
    this.thywill.cluster.sendToAll('myTaskType', taskData);

Keeping Track of Current Connections
------------------------------------

By default, a server-side Application instance is notified whenever a client
connects to or disconnects from the local process:

    // Invoked whenever a client connects to this process.
    Application.prototype.connection = function (client) {};
    // Invoked whenever a client disconnects from this process.
    Application.prototype.disconnection = function (client) {};

If the optional ClientTracker component is added to the main Thywill
configuration, and if the Cluster implementation allows for communication
between cluster members, then by default an Application will also be notified
whenever a client connects to or disconnects from any process in the cluster:

    // Invoked whenever a client connects to any process in the cluster.
    Application.prototype.connectionTo = function (clusterMemberId, client) {};
    // Invoked whenever a client disconnects from any process in the cluster.
    Application.prototype.disconnectionFrom = function (clusterMemberId, client) {};

If using a ClientTracker, the default notifications also include one for any
mass disconnection resulting from server process crash or restart:

    // Invoked when a cluster member process fails, thus disconnecting all its
    // clients - which will immediately be trying to reconnect to other cluster
    // members, probably even before this function is called.
    Application.prototype.clusterMemberDown = function (clusterMemberId, connectionData) {};

The default InMemoryClientTracker implementation keeps track of connected
clients, even in a clustered backend. In application code, for example, you
can call this method:

    // isConnected will be true if the client is connected to any of the
    // cluster processes.
    this.thywill.clientTracker.clientIsConnected(client, function (error, isConnected) {
      if (isConnected) {
        console.log(connectionId + ' is connected.');
      }
    });

The same thing works for sessions:

    // isConnected will be true if this session has one or more clients
    // connected to any of the cluster processes.
    this.thywill.clientTracker.clientSessionIsConnected(sessionId, function (error, isConnected) {
      if (isConnected) {
        console.log(sessionId + ' is connected.');
      }
    });

You can also obtain all of the current connection data for all processes:

    this.thywill.clientTracker.getConnectionData(function (error, data) {
      // The data object may be a reference to locally used data, so treat it
      // carefully.
    });

Using Channels
--------------

Channels provide a way of persisting the fact that two or more sessions are
grouped together. They are managed via (surprise) the optional ChannelManager
component.

You can make available a Redis-based ChannelManager for your Thywill
application by adding the following to the main configuration object:

    // Configuration for the ChannelManager implementation.
    config.channelManager = {
      implementation: {
        type: 'extra',
        name: 'redisChannelManager'
      },
      redisPrefix: 'thywill:chat:channel:',
      redisClient: redis.createClient()
    };
    // A RedisChannelManager requires that a ClientTracker component also be
    // used.
    config.clientTracker = {
      implementation: {
        type: 'extra',
        name: 'inMemoryClientTracker'
      }
    };

Adding sessions to a channel in Application class method code is illustrated
below. All connections for these sessions will be added to the channel as
subscribers there and then, and whenever new connections are made by those
sessions in the future.

    var self = this;
    var sessionIds = [sessionId1, sessionId2];
    this.thywill.channelManager.addSessionIds(channelId, sessionIds, function (error) {
      if (error) {
        self.thywill.log.error(error);
      }
    });

Publishing a message to the channel in any application class method code is
easy:

    this.sendToChannel(channelId, {
      name: 'value';
    });

You can see simple use of channels in the Chat example application, found
under /applications/chat/.

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
    util.inherits(ExampleApplication, Thywill.getBaseClass('RpcCapableApplication'));

In the client code:

    function ExampleApplicationInterface (applicationId) {
      Thywill.RpcCapableApplicationInterface.call(this, applicationId);
    }
    Thywill.inherits(ExampleApplicationInterface, Thywill.RpcCapableApplicationInterface);

Then to make a remote procedure call from the client:

    var data = {
      // Will look for this.rpcContext.exampleFunctions.exampleFunction in the
      // server Application instance context.
      name: 'exampleFunctions.exampleFunction',
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

See the Calculations example application for a simple demonstration, found
under /applications/calculations/.

A Work in Progress
------------------

Thywill is very much a work in progress, proceeding at a sedate pace. It
remains skeletal at this time, with much to be done. Nonetheless, the core
functions - it is possible to write applications on top of Thywill, should
you so feel the urge.

You will want to read through the material in /doc, and if interested take
a look at the example applications in /applications.
