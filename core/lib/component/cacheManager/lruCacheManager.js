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
 * A CacheManager implementation that generates in-memory LRU caches.
 *
 * It is cluster aware to the extent that clearing or setting a cached key on
 * one cluster member will clear the key on all cluster members.
 */
function LRUCacheManager() {
  LRUCacheManager.super_.call(this);
  this.caches = {};
}
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

  this.clearClusterTask = "thywill.cacheManager.clear";

  // Listen on the cluster instance for cache clearing messages.
  var self = this;
  this.thywill.cluster.on(this.clearClusterTask, function (taskData) {
    if (self.caches[taskData.id]) {
      self.caches[taskData.id].clearLocal(taskData.key);
    }
  });

  // There are no asynchronous initialization functions here or in the
  // superclasses. So we can just call them and forge ahead without having
  // to wait around or check for completion.
  this._announceReady(this.NO_ERRORS);
};

//-----------------------------------------------------------
// Methods.
//-----------------------------------------------------------

/**
 * Notify other members of the cluster and tell them to clear a key.
 *
 * @param {string} id
 *   An identifier for the specific cache to clear on.
 * @param {string} [key]
 *   The key by which the cached item can be retrieved.
 */
p.clearCacheKeyInOtherClusterMembers = function(id, key) {
  this.thywill.cluster.sendToOthers(this.clearClusterTask, {
    id: id,
    key: key
  });
};

/**
 * @see CacheManager#createCache
 */
p.createCache = function(id, size) {
  this.caches[id] = new LRUCache(this, id, size);
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
