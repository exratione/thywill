/**
 * @fileOverview
 * Vows tests for the LRUCacheManager component.
 */

var assert = require("assert");
var tools = require("./tools");
var Thywill = require("thywill");

tools.config.cacheManager = {
  implementation: {
    type: "core",
    name: "lruCacheManager"
  }
};

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuite("cacheManager/lruCacheManager", tools.config);

suite.addBatch({
  "lruCacheManager#createCache": {
    topic: function () {
      // Create a cache with room for only two items.
      return tools.thywill.cacheManager.createCache("testCache", 2);
    },
    "cache created successfully": function (cache) {
      assert.instanceOf(cache, Thywill.getBaseClass("Cache"));
      tools.cache = cache;
    }
  }
});
suite.addBatch({
  "add to cache #1": {
    topic: function () {
      var item = {key: "key 1", value: "value 1"};
      tools.cache.set(item.key, item.value);
      return item;
    },
    "added successfully #1": function(item) {
      assert.isTrue(item.value === tools.cache.get(item.key));
    }
  }
});
suite.addBatch({
  "add to cache #2": {
    topic: function () {
      var item = {key: "key 2", value: "value 2"};
      tools.cache.set(item.key, item.value);
      return item;
    },
    "added successfully #2": function(item) {
      assert.isTrue(item.value === tools.cache.get(item.key));
    }
  }
});
suite.addBatch({
  "add to cache #3": {
    topic: function () {
      var item = {key: "key 3", value: "value 3"};
      tools.cache.set(item.key, item.value);
      return item;
    },
    "added successfully #3": function(item) {
      assert.isTrue(item.value === tools.cache.get(item.key));
      // First one should have been kicked out.
      assert.isUndefined(tools.cache.get("key 1"));
    }
  }
});
suite.addBatch({
  "remove #2": {
    topic: function () {
      var key = "key 2";
      tools.cache.clear(key);
      return key;
    },
    "removed successfully": function(key) {
      assert.isUndefined(tools.cache.get(key));
    }
  }
});
suite.addBatch({
  "clear all remaining entries": {
    topic: function () {
      tools.cache.clear();
      return "key 3";
    },
    "cleared successfully": function(key) {
      assert.isUndefined(tools.cache.get(key));
    }
  }
});

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
