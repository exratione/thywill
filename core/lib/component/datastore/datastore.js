/**
 * @fileOverview
 * Datastore class definition.
 */

var util = require("util");
var Component = require("../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for datastores, used to retain information for use elsewhere
 * in Thywill.
 */
function Datastore() {
  Datastore.super_.call(this);
  this.componentType = "datastore";
};
util.inherits(Datastore, Component);
var p = Datastore.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------



//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * Store an object.
 * 
 * @param {string} key
 *   The key by which the stored object can be retrieved.
 * @param {Object} object
 *   Any Javascript object.
 * @param {Function} callback
 *   Of the form function (error), where error == null on success.
 */
p.store = function (key, object, callback) {
  throw new Error("Not implemented.");
};

/**
 * Pass the object associated with the key, or null if no such object, to the
 * callback. Remove the object from the datastore.
 * 
 * @param {string} key
 *   The key under which an object was earlier stored.
 * @param {Function} callback
 *   Of the form function (error, object), where error == null on success and
 *   object is the item stored.
 */
p.remove = function (key, callback) {
  throw new Error("Not implemented.");
};

/**
 * Load an object.
 * 
 * @param {string} key
 *   The key under which an object was earlier stored.
 * @param {Function} callback
 *   Of the form function (error, object), where error == null on success and
 *   object is the item stored.
 */
p.load = function (key, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Datastore;