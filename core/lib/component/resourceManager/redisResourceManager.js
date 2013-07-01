/**
 * @fileOverview
 * RedisResourceManager class definition.
 */

var util = require('util');
var Thywill = require('thywill');
var Resource = require('./resource');

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A resource manager backed by Redis and the Thywill cache. Suitable for
 * clustered Thywill processes.
 */
function RedisResourceManager () {
  RedisResourceManager.super_.call(this);
}
util.inherits(RedisResourceManager, Thywill.getBaseClass('ResourceManager'));
var p = RedisResourceManager.prototype;

//-----------------------------------------------------------
// 'Static' parameters
//-----------------------------------------------------------

RedisResourceManager.CONFIG_TEMPLATE = {
  cacheSize: {
    _configInfo: {
      description: 'Maximum number of resources that can be cached at one time.',
      types: 'integer',
      required: true
    }
  },
  redisPrefix: {
    _configInfo: {
      description: 'A prefix applied to Redis keys.',
      types: 'string',
      required: true
    }
  },
  redisClient: {
    _configInfo: {
      description: 'A Redis client instance from package "redis".',
      types: 'object',
      required: true
    }
  }
};

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

  // Set up a cache.
  this.cache = this.thywill.cacheManager.createCache('thywill.resourceManager.cache', this.config.cacheSize);

  // There are no asynchronous initialization functions here or in the
  // superclasses. So we can just call them and forge ahead without having
  // to wait around or check for completion.
  this._announceReady(this.NO_ERRORS);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see ResourceManager#store
 */
p.store = function (key, resource, callback) {
  var self = this;
  var json = this.resourceToRedisJson(resource);
  this.config.redisClient.set(this.config.redisPrefix + key, json, function (error) {
    if (!error) {
      // Add to the cache.
      self.cache.set(key, resource);
    }
    callback(error);
  });
};

/**
 * @see ResourceManager#remove
 */
p.remove = function (key, callback) {
  var self = this;
  var prefixedKey = this.config.redisPrefix + key;
  // Remove from the cache regardless of what happens with Redis.
  this.cache.clear(key);
  // Remove from Redis.
  this.config.redisClient.multi()
    .get(prefixedKey)
    .del(prefixedKey)
    .exec(function (error, results) {
      var resource;
      if (!error && results[0]) {
        resource = self.redisJsonToResource(results[0]);
      }
      callback(error, resource);
    });
};

/**
 * @see ResourceManager#load
 */
p.load = function (key, callback) {
  var self = this;
  // Check the cache.
  var resource = this.cache.get(key);
  if (resource) {
    callback(this.NO_ERRORS, resource);
  }
  // Not in the cache, worse luck, so load from Redis.
  else {
    this.config.redisClient.get(this.config.redisPrefix + key, function (error, json) {
      var resource = null;
      if (!error && json) {
        resource = self.redisJsonToResource(json);
      }
      // Put the resource into the cache if we found one.
      if (resource) {
        self.cache.set(key, resource);
      }
      callback(error, resource);
    });
  }
};

/**
 * Obtain a JSON string suitable to write to Redis.
 *
 * @param {Resource} resource
 *   A Resource instance.
 * @return {string}
 *   JSON suitable to write to Redis.
 */
p.resourceToRedisJson = function (resource) {
  var stored = {};
  for (var prop in resource) {
    if (prop !== 'buffer') {
      stored[prop] = resource[prop];
    }
  }
  // If it has a buffer, encode to base64. It might be binary data.
  if (resource.buffer) {
    stored.base64 = resource.buffer.toString('base64');
  }

  return JSON.stringify(stored);
};

/**
 * Turn a JSON string from Redis into a Resource.
 *
 * @param {string}
 *   JSON suitable to write to Redis.
 * @return {Resource} resource
 *   A Resource instance.
 */
p.redisJsonToResource = function (json) {
  var resource;
  try {
    var attributes = JSON.parse(json);
    var buffer = null;
    // If data was encoded, put it back into a buffer.
    if (attributes.base64) {
      buffer = new Buffer(attributes.base64, 'base64');
      delete attributes.base64;
    }
    resource = this.createResource(buffer, attributes);
  } catch (e) {
    this.thywill.log.error(e);
  }
  return resource;
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = RedisResourceManager;
