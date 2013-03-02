/**
 * @fileOverview
 * Batches for testing CacheManager classes.
 */

var assert = require("assert");
var Thywill = require("thywill");

/**
 * Add CacheManager general tests to the suite.
 */
exports.general = function (suite) {
  suite.addBatch({
    "cacheManager#createCache": {
      topic: function () {
        // Create a cache with room for only two items.
        return suite.thywillInstances[0].cacheManager.createCache("testCache", 2);
      },
      "cache created successfully": function (cache) {
        assert.instanceOf(cache, Thywill.getBaseClass("Cache"));
        suite.cache = cache;
      }
    }
  });
  suite.addBatch({
    "add to cache #1": {
      topic: function () {
        var item = {key: "key 1", value: "value 1"};
        suite.cache.set(item.key, item.value);
        return item;
      },
      "added successfully #1": function (item) {
        assert.strictEqual(item.value, suite.cache.get(item.key));
      }
    }
  });
  suite.addBatch({
    "add to cache #2": {
      topic: function () {
        var item = {key: "key 2", value: "value 2"};
        suite.cache.set(item.key, item.value);
        return item;
      },
      "added successfully #2": function (item) {
        assert.strictEqual(item.value, suite.cache.get(item.key));
      }
    }
  });
  suite.addBatch({
    "add to cache #3": {
      topic: function () {
        var item = {key: "key 3", value: "value 3"};
        suite.cache.set(item.key, item.value);
        return item;
      },
      "added successfully #3": function (item) {
        assert.strictEqual(item.value, suite.cache.get(item.key));
        // The first one should have been kicked out.
        assert.isUndefined(suite.cache.get("key 1"));
      }
    }
  });
  suite.addBatch({
    "remove #2": {
      topic: function () {
        var key = "key 2";
        suite.cache.clear(key);
        return key;
      },
      "removed successfully": function (key) {
        assert.isUndefined(suite.cache.get(key));
      }
    }
  });
  suite.addBatch({
    "clear all remaining entries": {
      topic: function () {
        suite.cache.clear();
        // Have to return something or it hangs.
        var key = "key 3";
        return key;
      },
      "cleared successfully": function (key) {
        assert.isUndefined(suite.cache.get(key));
      }
    }
  });
};
