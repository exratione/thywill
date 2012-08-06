/**
 * @fileOverview
 * LRUCacheManager class definition.
 */

var util = require("util");
var Thywill = require("thywill");
var LRUCache = require("./lruCache");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for cache managers, used to define caches.
 */
function LRUCacheManager() {
  LRUCacheManager.super_.call(this);
  this.caches = {};
};
util.inherits(LRUCacheManager, Thywill.getBaseClass("CacheManager"));
var p = LRUCacheManager.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

LRUCacheManager.CONFIG_TEMPLATE = null;

//-----------------------------------------------------------
//Initialization
//-----------------------------------------------------------

/**
* @see Component#_configure
*/
p._configure = function (thywill, config, callback) {
  // Minimal configuration - all we're doing here is storing it for posterity.
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
  
  // There are no asynchronous initialization functions here or in the 
  // superclasses. So we can just call them and forge ahead without having
  // to wait around or check for completion.
  this._announceReady(this.NO_ERRORS);
};

/**
* @see Component#_prepareForShutdown
*/
p._prepareForShutdown = function (callback) {
  // Nothing needed here.
  callback.call(this);
};

//-----------------------------------------------------------
// Methods.
//-----------------------------------------------------------

/**
 * @see CacheManager#createCache
 */
p.createCache = function(id, size, timeout) {
  this.caches[id] = new LRUCache(size, timeout);
  return this.caches[id];
};

/**
 * @see CacheManager#destroyCache
 */
p.destroyCache = function(id) {
  delete this.caches[id];
};

/**
 * @see CacheManager#getCache
 */
p.getCache = function(id) {
  return this.caches[id];
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = LRUCacheManager;
