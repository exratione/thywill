/**
 * @fileOverview
 * Utility code related to Express.
 */

/**
 * Generate a route for Express to serve this resource
 *
 * @param {Resource} resource
 *   A resource.
 * @return {function}
 *   A suitable route function for Express to use to serve the provided resource.
 */
exports.generateResourceRoute = function (resource) {
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

/**
 * Tell Express to serve this resource.
 *
 * @param {object} app
 *   An Express application.
 * @param {Resource} resource
 *   A resource.
 */
exports.serveResource = function (app, resource) {
  app.all(resource.clientPath, exports.generateResourceRoute(resource));
};

