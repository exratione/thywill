/**
 * @fileOverview
 * Batches for testing the LruCacheManager class.
 */

var assert = require("assert");
var Thywill = require("thywill");

/**
 * Add LruCacheManager cluster-specific tests to the suite.
 *
 * These test the clearing of caches in other cluster members in response
 * to clearing in one cluster member.
 */
exports.cluster = function (suite) {
  suite.addBatch({
    "create cluster caches": {
      topic: function () {
        // Create an array of caches with matching Ids and room for two items.
        return suite.thywillInstances.map(function (thywill, index, array) {
          return thywill.cacheManager.createCache("clusterCache", 2);
        });
      },
      "caches created successfully": function (caches) {
        caches.forEach(function (cache, index, array) {
          assert.instanceOf(cache, Thywill.getBaseClass("Cache"));
        });
        suite.caches = caches;
      }
    }
  });
  suite.addBatch({
    "propagate cache clear": {
      topic: function () {
        var key = "key1";
        suite.caches.forEach(function (cache, index, array) {
          cache.set(key, "value1");
          cache.set("key2", "value2");
        });
        // Clear one of them.
        suite.caches[0].clear(key);
        // Clearing goes via pub/sub so won't be instant. Wait 200ms.
        var self = this;
        setTimeout(function () {
          self.callback(null, key);
        }, 200);
      },
      "all caches cleared": function (key) {
        // All should be cleared for just that value.
        suite.caches.forEach(function (cache, index, array) {
          assert.isUndefined(cache.get(key));
          assert.strictEqual("value2", cache.get("key2"));
        });
      }
    }
  });
  suite.addBatch({
    "propagate clear on cache overwrite": {
      topic: function () {
        var key = "key1";
        var value = "value1";
        suite.caches.forEach(function (cache, index, array) {
          cache.set(key, value);
        });
        // Overwrite one of them.
        suite.caches[0].set(key, value);
        // Clearing goes via pub/sub so won't be instant. Wait 200ms.
        var self = this;
        setTimeout(function () {
          self.callback(null, key);
        }, 200);
      },
      "other caches cleared": function (key) {
        // All except the first should be cleared, for just that value.
        suite.caches.forEach(function (cache, index, array) {
          if (index === 0) {
            assert.strictEqual("value1", cache.get(key));
          } else {
            assert.isUndefined(cache.get(key));
          }
          assert.strictEqual("value2", cache.get("key2"));
        });
      }
    }
  });
  suite.addBatch({
    "propagate general clear": {
      topic: function () {
        // Overwrite one of them.
        suite.caches[0].clear();
        // Clearing goes via pub/sub so won't be instant. Wait 200ms.
        var self = this;
        setTimeout(function () {
          self.callback();
        }, 200);
      },
      "all caches cleared": function () {
        // All except the first should be cleared, for just that value.
        suite.caches.forEach(function (cache, index, array) {
          assert.isUndefined(cache.get("key2"));
        });
      }
    }
  });
};
