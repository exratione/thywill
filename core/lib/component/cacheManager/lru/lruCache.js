/**
 * @fileOverview
 * LRUCache class definition.
 */

var util = require("util");
var LRU = require("lru-cache");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * An LRU cache that uses the lru-cache package.
 */
function LRUCache(size, timeout) {
  LRUCache.super_.call(this);
  this.cache = LRU(size, null, timeout);
};
util.inherits(LRUCache, Thywill.getBaseClass("Cache"));
var p = LRUCache.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Cache#get
 */
p.get = function (key) {
  return this.cache.get(key);
};

/**
 * @see Cache#set
 */
p.set = function (key, value) {
  this.cache.set(key, value);
};

/**
 * @see Cache#clear
 */
p.clear = function(key) {
  if (key) {
    this.cache.del(key);
  } else {
    this.cache.reset();
  }
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = LRUCache;
