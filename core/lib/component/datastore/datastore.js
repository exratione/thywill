
var util = require("util");
var Component = require("../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

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

/*
 * Store an object.
 * 
 * key - the key by which the stored object can be retrieved.
 * object - any Javascript object.
 * callback - function (error), where error == null on success.
 */
p.store = function (key, object, callback) {
  throw new Error("Not implemented.");
};

/*
 * Pass the object associated with the key, or null if no such object, to the callback. Remove the object from the datastore.
 * 
 * key - the key under which an object was earlier stored.
 * callback - function (error, object), where error == null on success.
 */
p.remove = function (key, callback) {
  throw new Error("Not implemented.");
};

/*
 * Load an object.
 * 
 * key - the key under which an object was earlier stored.
 * callback - function (error, object), where error == null on success.
 * 
 */
p.load = function (key, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Datastore;