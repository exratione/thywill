/**
 * @fileOverview
 * CacheManager class definition.
 */

var util = require('util');
var Thywill = require('thywill');

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for cache managers, used to define caches.
 */
function CacheManager() {
  CacheManager.super_.call(this);
  this.componentType = 'cacheManager';
}
util.inherits(CacheManager, Thywill.getBaseClass('Component'));
var p = CacheManager.prototype;

//-----------------------------------------------------------
// Methods.
//-----------------------------------------------------------

/**
 * @see Component#_getDependencies
 */
p._getDependencies = function () {
  return {
    components: ['log', 'cluster']
  };
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * Create a new Cache instance.
 *
 * @param {string} id
 *   An identifier for this cache.
 * @param {Object} size
 *   Maximum number of items to be held by the cache before it starts dropping
 *   old items.
 * @return {Cache}
 *   A Cache instance.
 */
p.createCache = function (id, size) {
  throw new Error('Not implemented.');
};

/**
 * Destroy a previously created cache.
 *
 * @param {string} id
 *   An identifier for this cache.
 */
p.destroyCache = function (id) {
  throw new Error('Not implemented.');
};

/**
 * Obtain a previously created Cache instance.
 *
 * @param {string} id
 *   An identifier for this cache.
 * @return {Cache}
 *   A Cache instance.
 */
p.getCache = function (id) {
  throw new Error('Not implemented.');
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = CacheManager;
