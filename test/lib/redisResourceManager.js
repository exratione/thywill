/**
 * @fileOverview
 * Batches for testing the RedisResourceManager class.
 */

var assert = require("assert");
var Thywill = require("thywill");

/**
 * Add RedisResourceManager cluster-specific tests to the suite.
 */
exports.cluster = function (suite) {
  suite.addBatch({
    "create resource in cluster member alpha": {
      topic: function () {
        suite.createResourceFromFile(suite.thywillInstances[0].resourceManager, this.callback);
      },
      "resource created successfully": function (resource) {
        assert.instanceOf(resource, Thywill.getBaseClass("Resource"));
        suite.resources.file = resource;
      }
    }
  });
  suite.addBatch({
    "store resource in cluster member alpha": {
      topic: function () {
        suite.thywillInstances[0].resourceManager.store(
          suite.resources.file.clientPath, suite.resources.file, this.callback
        );
      },
      "resource stored successfully": function () {
      }
    }
  });
  suite.addBatch({
    "load resource in cluster member beta": {
      topic: function () {
        suite.thywillInstances[1].resourceManager.load(suite.resources.file.clientPath, this.callback);
      },
      "resource loaded successfully": function (resource) {
        assert.instanceOf(resource, Thywill.getBaseClass("Resource"));
        suite.assertResourcesEqual(resource, suite.resources.file);
      }
    }
  });
  suite.addBatch({
    "load cached resource in cluster member beta": {
      topic: function () {
        suite.thywillInstances[1].resourceManager.load(suite.resources.file.clientPath, this.callback);
      },
      "resource loaded successfully": function (resource) {
        assert.instanceOf(resource, Thywill.getBaseClass("Resource"));
        suite.assertResourcesEqual(resource, suite.resources.file);
      }
    }
  });
  suite.addBatch({
    "remove resource in cluster member beta": {
      topic: function () {
        suite.thywillInstances[1].resourceManager.remove(suite.resources.file.clientPath, this.callback);
      },
      "resource removed successfully": function (resource) {
        assert.instanceOf(resource, Thywill.getBaseClass("Resource"));
        suite.assertResourcesEqual(resource, suite.resources.file);
      }
    }
  });
  suite.addBatch({
    "load removed resource in cluster member beta": {
      topic: function () {
        suite.thywillInstances[1].resourceManager.load(suite.resources.file.clientPath, this.callback);
      },
      "resource is null": function (resource) {
        assert.isNull(resource);
      }
    }
  });
  suite.addBatch({
    "load removed resource in cluster member alpha": {
      topic: function () {
        suite.thywillInstances[0].resourceManager.load(suite.resources.file.clientPath, this.callback);
      },
      "resource is null": function (resource) {
        assert.isNull(resource);
      }
    }
  });
};
