/**
 * @fileOverview
 * Batches for testing Cluster class implementations.
 */

var assert = require('assert');

/**
 * Add Cluster cluster-specific tests to the suite.
 *
 * These test the communication between cluster members.
 */
exports.cluster = function (suite) {
  suite.addBatch({
    'cluster#sendTo': {
      topic: function () {
        var self = this;
        var taskData = {
          data: 'test'
        };
        var taskName = 'testTask';
        suite.thywills[1].cluster.once(taskName, function (receivedTaskData) {
          self.callback(null, receivedTaskData);
        });
        suite.thywills[0].cluster.sendTo('beta', taskName, taskData);
      },
      'task data received': function (taskData) {
        assert.strictEqual(taskData.data, 'test');
      }
    }
  });
  suite.addBatch({
    'cluster#sendToOthers': {
      topic: function () {
        var self = this;
        var taskData = {
          data: 'test'
        };
        var taskName = 'testTask';
        suite.thywills[1].cluster.once(taskName, function (receivedTaskData) {
          self.callback(null, receivedTaskData);
        });
        suite.thywills[0].cluster.sendToOthers(taskName, taskData);
      },
      'task data received': function (taskData) {
        assert.strictEqual(taskData.data, 'test');
      }
    }
  });
  suite.addBatch({
    'cluster#sendToAll': {
      topic: function () {
        var self = this;
        var taskData = {
          data: 'test'
        };
        var taskName = 'testTask';
        var received = suite.thywills.map(function (thywill, index, array) {
          return false;
        });
        suite.thywills.forEach(function (thywill, index, array) {
          thywill.cluster.once(taskName, function (receivedTaskData) {
            received[index] = receivedTaskData;
          });
        });
        suite.thywills[0].cluster.sendToAll(taskName, taskData);

        var intervalId = setInterval(function () {
          var anyUnreceivedLeft = received.some(function (element, index, array) {
            return !element;
          });
          if (!anyUnreceivedLeft) {
            clearInterval(intervalId);
            self.callback(null, received);
          }
        }, 50);
      },
      'task data received': function (received) {
        received.forEach(function (taskData, index, array) {
          assert.strictEqual(taskData.data, 'test');
        });
      }
    }
  });
};
