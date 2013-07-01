/**
 * @fileOverview
 * Batches for testing the ResourceManager classes.
 */

var assert = require('assert');
var Thywill = require('thywill');

/**
 * Obtain a simple Resource instance for testing.
 *
 * @param {ResourceManager}
 *   A ResourceManager instance.
 * @return {Resource}
 *   A Resource instance.
 */
exports.createSimpleResource = function (resourceManager) {
  return resourceManager.createResource('simple text resource', {
    clientPath: '/test/simple'
  });
};

/**
 * Load this file as a resource.
 *
 * @param {ResourceManager}
 *   A ResourceManager instance.
 * @param {function} callback
 *   Of the form function (error, resource).
 */
exports.createResourceFromFile = function (resourceManager, callback) {
  var attributes = {
    clientPath: '/test/file'
  };
  resourceManager.createResourceFromFile(__filename, attributes, callback);
};

/**
 * Assert these two Resources are equal.
 *
 * @param {Resource} resource1
 * @param {Resource} resource2
 */
exports.assertResourcesEqual = function (resource1, resource2) {
  assert.instanceOf(resource1, Thywill.getBaseClass('Resource'));
  assert.instanceOf(resource2, Thywill.getBaseClass('Resource'));

  var prop;
  for (prop in resource1) {
    if (prop === 'buffer') {
      assert.strictEqual(resource1.toString(), resource2.toString());
    } else {
      assert.strictEqual(resource1[prop], resource2[prop]);
    }
  }
};

/**
 * Add ResourceManager general tests to the suite.
 */
exports.general = function (suite) {
  suite.createSimpleResource = exports.createSimpleResource;
  suite.createResourceFromFile = exports.createResourceFromFile;
  suite.assertResourcesEqual = exports.assertResourcesEqual;

  suite.addBatch({
    'resourceManager#createResource': {
      topic: function () {
        return suite.createSimpleResource(suite.thywills[0].resourceManager);
      },
      'resource created successfully': function (resource) {
        assert.instanceOf(resource, Thywill.getBaseClass('Resource'));
        suite.resources = {
          simple: resource
        };
      }
    }
  });
  suite.addBatch({
    'resourceManager#createResourceFromFile': {
      topic: function () {
        suite.createResourceFromFile(suite.thywills[0].resourceManager, this.callback);
      },
      'resource created successfully': function (resource) {
        assert.instanceOf(resource, Thywill.getBaseClass('Resource'));
        suite.resources.file = resource;
      }
    }
  });
  suite.addBatch({
    'resourceManager#store': {
      topic: function () {
        suite.thywills[0].resourceManager.store(
          suite.resources.simple.clientPath, suite.resources.simple, this.callback
        );
      },
      'resource stored successfully': function () {
      }
    }
  });
  suite.addBatch({
    'resourceManager#load': {
      topic: function () {
        suite.thywills[0].resourceManager.load(suite.resources.simple.clientPath, this.callback);
      },
      'resource loaded successfully': function (resource) {
        assert.instanceOf(resource, Thywill.getBaseClass('Resource'));
        suite.assertResourcesEqual(resource, suite.resources.simple);
      }
    }
  });
  suite.addBatch({
    'resourceManager#remove': {
      topic: function () {
        suite.thywills[0].resourceManager.remove(suite.resources.simple.clientPath, this.callback);
      },
      'resource removed successfully': function (resource) {
        assert.instanceOf(resource, Thywill.getBaseClass('Resource'));
        suite.assertResourcesEqual(resource, suite.resources.simple);
      }
    }
  });
  suite.addBatch({
    'resourceManager#load removed resource': {
      topic: function () {
        suite.thywills[0].resourceManager.load(suite.resources.simple.clientPath, this.callback);
      },
      'resource is null': function (resource) {
        assert.isNull(resource);
      }
    }
  });

};
