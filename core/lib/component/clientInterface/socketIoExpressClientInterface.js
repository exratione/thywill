/**
 * @fileOverview
 * SocketIoExpressClientInterface class definition.
 */

var util = require("util");
var async = require("async");
var clone = require("clone");
var Thywill = require("thywill");
var SocketIoClientInterface = require("./socketIoClientInterface");

// -----------------------------------------------------------
// Class Definition
// -----------------------------------------------------------

/**
 * @class
 * An extension of SocketIoClientInterface that uses Express to serve files
 * and manage sessions.
 *
 * @see SocketIoClientInterface
 */
function SocketIoExpressClientInterface () {
  SocketIoExpressClientInterface.super_.call(this);
}
util.inherits(SocketIoExpressClientInterface, SocketIoClientInterface);
var p = SocketIoExpressClientInterface.prototype;

// -----------------------------------------------------------
// "Static" parameters
// -----------------------------------------------------------

SocketIoExpressClientInterface.CONFIG_TEMPLATE = clone(SocketIoClientInterface.CONFIG_TEMPLATE);

SocketIoExpressClientInterface.CONFIG_TEMPLATE.server.app = {
  _configInfo: {
    description: "An Express application instance.",
    types: "function",
    required: false
  }
};

SocketIoExpressClientInterface.CONFIG_TEMPLATE.sessions = {
  store: {
    _configInfo: {
      description: "For Express sessions: the session store instance.",
      types: "object",
      required: false
    }
  },
  cookieKey: {
    _configInfo: {
      description: "For Express sessions: The name used for session cookies.",
      types: "string",
      required: false
    }
  },
  cookieSecret: {
    _configInfo: {
      description: "For Express sessions: The secret value used for session cookies.",
      types: "string",
      required: false
    }
  }
};

// -----------------------------------------------------------
// Initialization
// -----------------------------------------------------------

/**
 * @see SocketIoClientInterface#_startup
 */
p._startup = function (callback) {
  this._setExpressToServeResources();
  this._initializeSocketIo();
  this._attachExpressSessionsToSockets();
  this._setupBootstrapResources(callback);
};

/**
 * Add middleware to Express to ensure that it will serve Resources regardless
 * of current or future addition of routes or middleware.
 *
 * This involves being a little devious.
 */
p._setExpressToServeResources = function () {
  var self = this;
  var express = require("express");

  // This middleware essentially performs the action of a route. This is a way
  // to ensure that Thywill routes will run no matter the order in which
  // routes or middleware are added.
  var middleware = function (req, res, next) {
    // Is this request in the right base path?
    if (req.path.match(self.config.baseClientPathRegExp)) {
      // But do we have a resource for this?
      self.getResource(req.path, function (error, resource) {
        // If there's an error or a resource, handle it.
        if (error || resource) {
          self.handleResourceRequest(req, res, next, error, resource);
        } else {
          // Otherwise, onwards and let Express take over.
          next();
        }
      });
    } else {
      // Otherwise, onwards and let Express take over.
      next();
    }
  };

  // Add the middleware.
  middleware.isThywill = true;
  this.config.server.app.use(middleware);

  /**
   * Put the Thywill middleware in the right place in the Express stack,
   * which should be last before the router. At the time this is called,
   * the router middleware may or may not have been added, and other
   * middleware may also later be added.
   */
  function positionMiddleware () {
    // The stack wil be at least length 1, as the Thywill middleware has been put there
    // before this function is called.
    var desiredIndex = self.config.server.app.stack.length - 1;
    // Get the index of the router. Should be last, but if we can add
    // middleware out of sequence, so can other people.
    for (var index = 0; index < self.config.server.app.stack.length; index++) {
      // TODO: a less sketchy way of identifying the router middleware.
      if (self.config.server.app.stack[index].handle === self.config.server.app._router.middleware) {
        // If the router middleware is added, then routes have been
        // added, and thus no more middleware will be added.
        clearInterval(positionMiddlewareIntervalId);
        desiredIndex = index;
        break;
      }
    }

    // If it is already in the right place, then we're good.
    if(self.config.server.app.stack[desiredIndex].handle.isThywill) {
      return;
    }

    // Otherwise, remove from the present position.
    var stackItem;
    self.config.server.app.stack = self.config.server.app.stack.filter(function (element, index, array) {
      if (element.handle.isThywill) {
        stackItem = element;
      }
      return !element.handle.isThywill;
    });

    // Insert it into the relevant place.
    self.config.server.app.stack.splice(desiredIndex, 0, stackItem);
  }
  // This will run until the Router middleware is added, which happens
  // when the first route is set.
  var positionMiddlewareIntervalId = setInterval(positionMiddleware, 100);
};

/**
 * This is how we attach Express sessions to the sockets. The result is that
 * socket.handshake.session holds the session, and socket.handshake.sessionId
 * has the session ID.
 *
 * This code was adapted from:
 * https://github.com/alphapeter/socket.io-express
 */
p._attachExpressSessionsToSockets = function () {
  var self = this;
  var express = require("express");
  var cookieParser = express.cookieParser(this.config.sessions.cookieSecret);
  // We're using the authorization hook, but there is no authorizing going on
  // here - we're only attaching the session to the socket handshake.
  this.socketFactory.set("authorization", function (data, callback) {
    if (data && data.headers && data.headers.cookie) {
      cookieParser(data, {}, function (error) {
        if (error) {
          self.thywill.debug(error);
          callback("COOKIE_PARSE_ERROR", false);
          return;
        }

        var sessionId = data.signedCookies[self.config.sessions.cookieKey];
        self.loadSession(sessionId, function (error, session) {
          // Add the sessionId. This will show up in
          // socket.handshake.sessionId.
          //
          // It's useful to set the ID and session separately because of
          // those fun times when you have an ID but no session - it makes
          // debugging that much easier.
          data.sessionId = sessionId;
          if (error) {
            self.thywill.debug(error);
            callback("ERROR", false);
          } else if (!session) {
            callback("NO_SESSION", false);
          } else {
            // Add the session. This will show up in
            // socket.handshake.session.
            data.session = session;
            callback(null, true);
          }
        });
      });
    } else {
      callback("NO_COOKIE", false);
    }
  });
};

// -----------------------------------------------------------
// Connection and serving data methods
// -----------------------------------------------------------


/**
 * Extract the session data we're going to be using from the socket.
 *
 * @param {Object} socket
 *   A socket.
 * @param {Object}
 *   Of the form {connectionId: string, sessionId: string, session: object}.
 *   Either sessionId or session can be undefined under some circumstances,
 *   so check.
 */
p.connectionDataFromSocket = function (socket) {
  var data = {
    connectionId: socket.id,
    sessionId: undefined,
    session: undefined
  };
  if (socket.handshake) {
    data.sessionId = socket.handshake.sessionId;
    data.session = socket.handshake.session;
  }
  return data;
};

/**
 * Handle a request with http.Server or Express.
 *
 * @param {Object} req
 *   Request object from the server.
 * @param {Object} res
 *   Response object from the server.
 * @param {function} next
 *   Express callback function.
 * @param {mixed} error
 *   Any error resulting from finding the resource.
 * @param {Resource} resource
 *   The resource to server up.
 */
p.handleResourceRequest = function (req, res, next, error, resource) {
  var self = this;

  if (error) {
    this._send500ResourceResponse(req, res, next, error);
    return;
  } else if (!resource) {
    this._send500ResourceResponse(req, res, next, new Error("Missing resource."));
    return;
  }

  if (resource.isInMemory()) {
    res.setHeader("Content-Type", resource.type);
    res.send(resource.buffer);
  } else if (resource.isPiped()) {
    res.setHeader("Content-Type", resource.type);
    res.sendFile(resource.filePath, {
      // TODO: maxage configuration.
      maxAge: 0
    });
  } else {
    // This resource is probably not set up correctly. It should either have
    // data in memory or be set up to be piped.
    this._send500ResourceResponse(req, res, next, new Error("Resource incorrectly configured: " + req.path));
  }
};

/**
 * Send a 500 error response down to the client when a resource is requested.
 *
 * @param {Object} req
 *   Request object from the server.
 * @param {Object} res
 *   Response object from the server.
 * @param {function} next
 *   Express callback function.
 * @param {mixed} error
 *   The error.
 */
p._send500ResourceResponse = function (req, res, next, error) {
  this.thywill.log.error(error);
  next(error.stack || error.toString());
};

/**
 * @see ClientInterface#loadSession
 */
p.loadSession = function (client, callback) {
  var sessionId = this._clientOrSessionIdToSessionId(client);
  this.config.sessions.store.get(sessionId, callback);
};

/**
 * @see ClientInterface#storeSession
 */
p.storeSession = function (client, session, callback) {
  var sessionId = this._clientOrSessionIdToSessionId(client);
  this.config.sessions.store.set(sessionId, session, callback);
};

// -----------------------------------------------------------
// Exports - Class Constructor
// -----------------------------------------------------------

module.exports = SocketIoExpressClientInterface;
