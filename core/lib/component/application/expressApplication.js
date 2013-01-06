/**
 * @fileOverview
 * Application class definition.
 */

var util = require("util");
var express = require("express");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for applications running on Thywill that make use of Express.
 * All it adds is some additional helpful functionality for setting up
 * bootstrap and other resources to be served by Express rather than Thywill.
 *
 * @param {string} id
 *   An ID uniquely identifying this application.
 * @param {object} app
 *   An Express application instance.
 */
function ExpressApplication (id, app) {
  ExpressApplication.super_.call(this, id);
  this.app = app;
}
util.inherits(ExpressApplication, Thywill.getBaseClass("Application"));
var p = ExpressApplication.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Application#storeBootstrapResourceFromFile
 */
p.storeBootstrapResourceFromFile = function (filePath, attributes, callback) {
  var self = this;
  // We have to store the resource even if it's going to be served by Express,
  // so that it can be minified or otherwise made use of by core Thywill.
  ExpressApplication.super_.prototype.storeBootstrapResourceFromFile.call(this, filePath, attributes, function (error, resource) {
    if (!error) {
      // Set up Express to serve this thing if the resource is so defined.
      if (resource.servedBy === self.thywill.resourceManager.servedBy.EXPRESS) {
        var routeFunction = self.getExpressRouteFunction(resource);
        self.app.get(resource.clientPath, routeFunction);
      }
    }
    callback(error, resource);
  });
};

/**
 * Serve a directory of static files via Express. This does not create Resources or
 * in any way make Thywill aware of these files - so they won't be minimized, for
 * example.
 *
 * @param {string} clientPath
 *   The path used by the client to access this directory.
 * @param {string} directoryPath
 *   An absolute file system path to the directory. e.g. /var/www
 */
p.serveStaticDirectoryViaExpress = function (clientPath, directoryPath) {
  this.app.use(clientPath, express.static(directoryPath, {
    // TODO maxage configuration?
    maxAge: 0
  }));
};

/**
 * Generate a route function for Express to serve this resource
 *
 * @param {Resource} resource
 *   A resource.
 * @return {function}
 *   A suitable route function for Express to use to serve the provided resource.
 */
p.getExpressRouteFunction = function (resource) {
  return function (req, res, next) {
    if (resource.isInMemory()) {
      res.setHeader("Content-Type", resource.type);
      // TODO: Using the buffer length is only going to be correct if people
      // always use right-sized buffers for the content they contain.
      res.setHeader("Content-Length", resource.buffer.length);
      res.end(resource.buffer);
    } else if (resource.isPiped()) {
      res.setHeader("Content-Type", resource.type);
      res.sendFile(resource.filePath, {
        // TODO maxage configuration?
        maxAge: 0
      }, function (error) {
        next(error);
      });
    } else {
      next(new Error("Invalid resource."));
    }
  };
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ExpressApplication;
