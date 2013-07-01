/**
 * @fileOverview
 * LRUCache class definition.
 */

var util = require('util');
var LRU = require('lru-cache');
var Thywill = require('thywill');

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * An LRU cache that uses the lru-cache package.
 *
 * It is cluster aware to the extent that clearing or setting a cached key on
 * one cluster member will clear the key on all cluster members.
 *
 * @param {CacheManager} cacheManager
 *   The CacheManager instance that holds a reference to this cache.
 * @param {string} id
 *   The identifier for this cache. This should be the same across cluster
 *   members - the same cache doing the same job should have the same ID in
 *   each process.
 * @param {number} size
 *   A size limit for the cache, here a count of contained items.
 * @param {number} timeout
 *   How long before items are removed.
 */
function LRUCache(cacheManager, id, size) {
  LRUCache.super_.call(this);
  this.id = id;
  this.cacheManager = cacheManager;
  this.cache = LRU({
    max: size
  });
}
util.inherits(LRUCache, Thywill.getBaseClass('Cache'));
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
  // If we are overwriting an existing key, then invalidate that key on other
  // cluster members.
  if (this.cache.has(key)) {
    this.cacheManager.clearCacheKeyInOtherClusterMembers(this.id, key);
  }
  this.cache.set(key, value);
};

/**
 * @see Cache#clear
 */
p.clear = function (key) {
  this.clearLocal(key);
  this.cacheManager.clearCacheKeyInOtherClusterMembers(this.id, key);
};

/**
 * Clear the cached key without notifying the rest of the cluster to do the
 * same.
 *
 * @see Cache#clear
 */
p.clearLocal = function (key) {
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
