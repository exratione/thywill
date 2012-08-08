/**
 * @fileOverview
 * LinkedFileResourceManager class definition.
 */

// A slightly extended version of core fs, with functions for recursive
// creation of directories.
var fs = require("node-fs");
var pathUtils = require("path");
var util = require("util");
var Thywill = require("thywill");
var InMemoryResourceManager = require("../inMemoryResourceManager/inMemoryResourceManager");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A resource manage that writes or symlinks resources in the filesystem,
 * and stores references to that data in memory.
 * 
 * This is useful as a way to offload the serving of resources to another
 * process: write or symlink resources to a webroot served by Nginx, for
 * example.
 */
function LinkedFileResourceManager() {
  LinkedFileResourceManager.super_.call(this);
};
util.inherits(LinkedFileResourceManager, InMemoryResourceManager);
var p = LinkedFileResourceManager.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

LinkedFileResourceManager.CONFIG_TEMPLATE = {
  baseDirectory: {
    _configInfo: {
      description: "The directory to which resources will be written as files. e.g. /var/www or /home/node/thywill-static",
      types: "string",
      required: true
    } 
  },
  baseClientPath: {
    _configInfo: {
      description: "A base path prepended to provided resource paths. e.g. /thywill-static",
      types: "string",
      required: true
    } 
  }  
};

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

/**
 * @see Component#_configure
 */
p._configure = function (thywill, config, callback) {
  // Minimal configuration setup.
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
  
  // List of functions to call via async.
  fns = [
  // Check on the existence of the base directory and that its has suitable
  // permissions.
    function(asyncCallback) {
      this.directoryExists(this.config.baseDirectory, asyncCallback);
    }
  ];
  
  async.series(fns, function (error) {
    this._announceReady(error);
  });
};

/**
 * @see Component#_prepareForShutdown
 */
p._prepareForShutdown = function (callback) {

  
  
  // TODO: clean up resources? What about controlled restarts?
  
  
  
  callback.call(this);
};
  
//-----------------------------------------------------------
// Other Overridden Methods
//-----------------------------------------------------------

/**
 * @see ResourceManager#createResource
 */
p.createResource = function (data, attributes) {
  // If we have a string rather than null or a Buffer, then convert it into a
  // Buffer.
  if (typeof data == "string") {
    data = new Buffer(data, attributes.encoding);
  };
  
  // TODO: Tighten this up to accommodate issues with delimiters, etc.
  
  // First the parent class creates the resource.
  var resource = LinkedFileResourceManager.super_.prototype.createResource.call(this, data, attributes);  
  // Take the provided path as the basis for where this file will be stored.
  resource.filePath = this.config.baseDirectory + resource.path;
  // If path is not suitable for a file, add some file to the end of it, e.g. /dir/ -> /dir/default
  if (resource.filePath[resource.filePath.length - 1] == "/") {
    resource.filePath += "default";
    // TODO: add file type ending?
  }
  // Change the provided path to point to the file resource directory.
  resource.clientPath = this.config.baseClientPath + resource.clientPath;
  return resource;
};

/**
 * @see ResourceManager#store
 */
p.store = function (key, resource, callback) {
  var self = this;
  
  var innerCallback = function(error) {
    if (error) {
      callback.call(self, error);
    } else {
      // Store an in-memory reference as the parent class does.
      LinkedFileResourceManager.super_.prototype.store.call(self, key, resource, callback);
    }
  };
  
  // Either write the resource to a file or symlink it, depending on whether it
  // has a defined origin file path.
  if (!resource.originFile) {
    this.writeResourceToFile(resource, innerCallback);
  } else {
    this.createResourceSymlink(resource, innerCallback);
  }
};

/**
 * @see ResourceManager#remove
 */
p.remove = function (key, callback) {
  var self = this;
  var resource = this.data[key];
  fs.unlink(resource.fileSystemPath, function(error) {
    if (error) {
      callback.call(self, error);
    } else {
      // Remove the in-memory reference as the parent class does.
      LinkedFileResourceManager.super_.prototype.remove.call(self, key, callback);
    }
  });
};

//-----------------------------------------------------------
// Other Methods
//-----------------------------------------------------------

/**
 * Given a file or directory stats object, determine whether the present
 * process has write permissions.
 * 
 * @params {Object} stats
 *   A Stats instance, e.g. obtained from fs.stat().
 * @return {boolean}
 *   True if the present process can read the file or directory.
 */
p.canRead = function (stats) {
  var isOwner = stats.uid == process.getuid();
  var inGroup = stats.gid == process.getgid();
  return 
    // User is owner and owner can read.
    isOwner && (stats.mode & 00400) ||
    // User is in group and group can read.
    inGroup && (stats.mode & 00040) || 
    // Anyone can read.
    (stats.mode & 00004); 
};

/**
 * Given a file or directory stats object, determine whether the present
 * process has write permissions.
 * 
 * @params {Object} stats
 *   A Stats instance, e.g. obtained from fs.stat().
 * @return {boolean}
 *   True if the present process can write to the file or directory.
 */
p.canWrite = function (stats) {
  var isOwner = stats.uid == process.getuid();
  var inGroup = stats.gid == process.getgid();
  return 
    // User is owner and owner can write.
    isOwner && (stats.mode & 00200) ||
    // User is in group and group can write.
    inGroup && (stats.mode & 00020) || 
    // Anyone can write.
    (stats.mode & 00002); 
};

/**
 * Given a file or directory stats object, determine whether the present
 * process has exec permissions.
 * 
 * @params {Object} stats
 *   A Stats instance, e.g. obtained from fs.stat().
 * @return {boolean}
 *   True if the present process has exec permissions on the file or directory.
 */
p.canWrite = function (stats) {
  var isOwner = stats.uid == process.getuid();
  var inGroup = stats.gid == process.getgid();
  return 
    // User is owner and owner can exec.
    isOwner && (stats.mode & 00100) ||
    // User is in group and group can exec.
    inGroup && (stats.mode & 00010) || 
    // Anyone can exec.
    (stats.mode & 00001); 
};

/**
 * Check the existence of a directory with suitable permissions - both write
 * and exec for this process.
 * 
 * @param {string} path
 *   A filesystem path.
 * @param {Function} callback
 *   Of the form function(error) where error = null if the directory exists
 *   with suitable permissions.
 */
p.directoryExists = function (path, callback) {
  fs.stats(path, function(error, stats) {
    if (!error) {
      if (stats.isDirectory()) {
        if (!this.canWrite(stats)) {
          error = "Directory exists but is not writable: " + path;
        } else if (!this.canExec(stats)) {
          error = "Directory exists but without exec permission: " + path;
        }
      } else {
        error = "Path is a file not a directory: " + path;
      }
    }
    callback.call(this, error);
  });
};

/**
 * Write a resource to the file system as a file. Expects the property
 * resource.filePath to exist.
 * 
 * @param {Resource} resource
 *   A Resource instance.
 * @param {Function} callback
 *   Of the form function(error) where error = null on success.
 */
p.writeResourceToFile = function (resource, callback) {
  var self = this;
  // Array of asynchronous functions to call in series.
  var fns = [
    // Make sure the directory exists.           
    function (asyncCallback) {
      fs.mkdir(pathUtils.dirname(resource.fileSystemPath), 0755, true, asyncCallback);
    },
    function (asyncCallback) {
      var stream = fs.createWriteStream({
        // Overwrite an existing file.
        flags: "w",
        // Writing out buffers, so no encoding needed.
        encoding: null,
        mode: 0644
      });

      stream.on("error", function(exception) {
        callback.call(self, exception.message);
      });
      stream.on("end", function() {
        stream.destroy();
        callback.call(self, self.NO_ERRORS);
      });
      stream.end(resource.buffer);
    }
  ];
  // Run the functions to get the file written.
  async.series(fns, callback);
};

/**
 * Create a symlink to the original resource file. Expects the properties
 * resource.originFilePath and resource.filePath to exist.
 * 
 * @param {Resource} resource
 *   A Resource instance.
 * @param {Function} callback
 *   Of the form function(error) where error = null on success.
 */
p.createResourceSymlink = function (resource, callback) {
  var self = this;
  // Array of asynchronous functions to call in series.
  var fns = [
    // Make sure the directory exists.           
    function (asyncCallback) {
      fs.mkdir(pathUtils.dirname(resource.fileSystemPath), 0755, true, asyncCallback);
    },
    // Create the symlink.
    function (asyncCallback) {
      fs.symlink(resource.originFilePath, resource.filePath, 'file', asyncCallback);
    }
  ];
  // Run the functions to get the file written.
  async.series(fns, callback);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = LinkedFileResourceManager;
