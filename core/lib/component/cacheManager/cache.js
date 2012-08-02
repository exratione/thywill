/**
 * @fileOverview
 * Cache class definition.
 */

var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A Cache implementation manages caching of data.
 */
function Cache() {};
var p = Cache.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * Return a JSON string representing this object.
 * 
 * @param {string} key
 *   The key by which the cached item can be retrieved.
 * @return {mixed}
 *   The cached value or null.
 */
p.get = function (key) {
  throw new Error("Not implemented.");
};

/**
 * Return a JSON string representing this object.
 * 
 * @param {string} key
 *   The key by which the cached item can be retrieved.
 * @param {mixed} value
 *   Any value.
 */
p.set = function (key, value) {
  throw new Error("Not implemented.");
};

/**
 * Remove a key from the cache, or clear the entire cache if no key is
 * provided.
 * 
 * @param {string} [key]
 *   The key by which the cached item can be retrieved.
 */
p.clear = function(key) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Cache;