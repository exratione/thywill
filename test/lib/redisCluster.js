/**
 * @fileOverview
 * Batches for testing the RedisCluster class.
 */

var assert = require("assert");

/**
 * Add RedisCluster cluster-specific tests to the suite.
 *
 * These test the communication between cluster members.
 */
exports.cluster = function (suite) {
  suite.addBatch({
    "redisCluster#sendTo": {
      topic: function () {
        var self = this;
        var taskData = {
          data: "test"
        };
        var taskName = "testTask";
        suite.thywillInstances[1].cluster.once(taskName, function (receivedTaskData) {
          self.callback(null, receivedTaskData);
        });
        suite.thywillInstances[0].cluster.sendTo("beta", taskName, taskData);
      },
      "task data received": function (taskData) {
        assert.strictEqual(taskData.data, "test");
      }
    }
  });
  suite.addBatch({
    "redisCluster#sendToOthers": {
      topic: function () {
        var self = this;
        var taskData = {
          data: "test"
        };
        var taskName = "testTask";
        suite.thywillInstances[1].cluster.once(taskName, function (receivedTaskData) {
          self.callback(null, receivedTaskData);
        });
        suite.thywillInstances[0].cluster.sendToOthers(taskName, taskData);
      },
      "task data received": function (taskData) {
        assert.strictEqual(taskData.data, "test");
      }
    }
  });
  suite.addBatch({
    "redisCluster#sendToAll": {
      topic: function () {
        var self = this;
        var taskData = {
          data: "test"
        };
        var taskName = "testTask";
        var received = suite.thywillInstances.map(function (thywill, index, array) {
          return false;
        });
        suite.thywillInstances.forEach(function (thywill, index, array) {
          thywill.cluster.once(taskName, function (receivedTaskData) {
            received[index] = receivedTaskData;
          });
        });
        suite.thywillInstances[0].cluster.sendToAll(taskName, taskData);

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
      "task data received": function (received) {
        received.forEach(function (taskData, index, array) {
          assert.strictEqual(taskData.data, "test");
        });
      }
    }
  });
};
