/**
 * @fileOverview
 * Batches for testing ChannelManager classes.
 */

var assert = require("assert");
var Thywill = require("thywill");

/**
 * Add ChannelManager general tests to the suite.
 */
exports.general = function (suite) {
  var testChannelId = "test-channel";
  var testSessionIds = ["a", "b", "c", "d"];

  suite.addBatch({
    "channelManager#getChannelIdsForSession empty": {
      topic: function () {
        suite.thywills[0].channelManager.getChannelIdsForSession("no-session", this.callback);
      },
      "empty array returned": function (error, channelIds) {
        assert.equal(error, null);
        assert.deepEqual(channelIds, []);
      }
    }
  });
  suite.addBatch({
    "channelManager#getSessionIds empty": {
      topic: function () {
        suite.thywills[0].channelManager.getSessionIds("not-a-channel", this.callback);
      },
      "empty array returned": function (error, sessionIds) {
        assert.equal(error, null);
        assert.deepEqual(sessionIds, []);
      }
    }
  });
  suite.addBatch({
    "channelManager#addSessionIds": {
      topic: function () {
        suite.thywills[0].channelManager.addSessionIds(testChannelId, testSessionIds, this.callback);
      },
      "add successful": function (error) {
        assert.equal(error, null);
      }
    }
  });
  suite.addBatch({
    "channelManager#addSessionIds again": {
      topic: function () {
        suite.thywills[0].channelManager.addSessionIds(testChannelId, testSessionIds, this.callback);
      },
      "add successful": function (error) {
        assert.equal(error, null);
      }
    }
  });
  suite.addBatch({
    "channelManager#getSessionIds": {
      topic: function () {
        suite.thywills[0].channelManager.getSessionIds(testChannelId, this.callback);
      },
      "correct sessions returned": function (error, sessionIds) {
        assert.equal(error, null);
        assert.isArray(sessionIds);
        assert.deepEqual(sessionIds.sort(), testSessionIds);
      }
    }
  });
  suite.addBatch({
    "channelManager#removeSessionIds": {
      topic: function () {
        suite.thywills[0].channelManager.removeSessionIds(testChannelId, testSessionIds, this.callback);
      },
      "remove successful": function (error) {
        assert.equal(error, null);
      }
    }
  });
  suite.addBatch({
    "channelManager#getSessionIds empty again": {
      topic: function () {
        suite.thywills[0].channelManager.getSessionIds(testChannelId, this.callback);
      },
      "empty array returned": function (error, sessionIds) {
        assert.equal(error, null);
        assert.deepEqual(sessionIds, []);
      }
    }
  });
  suite.addBatch({
    "channelManager#clear": {
      topic: function () {
        var self = this;
        suite.thywills[0].channelManager.addSessionIds(testChannelId, testSessionIds, function (error) {
          suite.thywills[0].channelManager.clear(testChannelId, self.callback);
        });
      },
      "correct sessions returned": function (error, sessionIds) {
        assert.equal(error, null);
        assert.isArray(sessionIds);
        assert.deepEqual(sessionIds.sort(), testSessionIds);
      }
    }
  });
};

/**
 * Add ChannelManager cluster tests to the suite.
 */
exports.cluster = function (suite) {
  var testChannelId = "test-channel";
  var testSessionIds = ["a", "b", "c", "d"];

  suite.addBatch({
    "emit on add": {
      topic: function () {
        var self = this;
        var channelManager = suite.thywills[1].channelManager;
        channelManager.once(channelManager.events.SESSIONS_ADDED, function (channelId, sessionIds) {
          self.callback(channelId, sessionIds);
        });
        suite.thywills[0].channelManager.addSessionIds(testChannelId, testSessionIds, function (error) {
          // Do nothing.
        });
      },
      "emit happened": function (channelId, sessionIds) {
        assert.isArray(sessionIds);
        assert.deepEqual(sessionIds.sort(), testSessionIds);
        assert.strictEqual(channelId, testChannelId);
      }
    }
  });
  suite.addBatch({
    "channelManager#getSessionIds from other process": {
      topic: function () {
        suite.thywills[1].channelManager.getSessionIds(testChannelId, this.callback);
      },
      "session IDs returned correctly": function (error, sessionIds) {
        assert.equal(error, null);
        assert.deepEqual(sessionIds.sort(), testSessionIds);
      }
    }
  });
  suite.addBatch({
    "emit on remove": {
      topic: function () {
        var self = this;
        var channelManager = suite.thywills[1].channelManager;
        channelManager.once(channelManager.events.SESSIONS_REMOVED, function (channelId, sessionIds) {
          self.callback(channelId, sessionIds);
        });
        suite.thywills[0].channelManager.removeSessionIds(testChannelId, testSessionIds, function (error) {
          // Do nothing.
        });
      },
      "emit happened": function (channelId, sessionIds) {
        assert.isArray(sessionIds);
        assert.deepEqual(sessionIds.sort(), testSessionIds);
        assert.strictEqual(channelId, testChannelId);
      }
    }
  });
  suite.addBatch({
    "channelManager#getSessionIds empty in other process": {
      topic: function () {
        suite.thywills[1].channelManager.getSessionIds(testChannelId, this.callback);
      },
      "empty array returned": function (error, sessionIds) {
        assert.equal(error, null);
        assert.deepEqual(sessionIds, []);
      }
    }
  });
  suite.addBatch({
    // Clearing should still emit for removing the session IDs in the channel.
    "emit on clear": {
      topic: function () {
        var self = this;
        var channelManager = suite.thywills[1].channelManager;
        channelManager.once(channelManager.events.SESSIONS_REMOVED, function (channelId, sessionIds) {
          self.callback(channelId, sessionIds);
        });
        suite.thywills[0].channelManager.addSessionIds(testChannelId, testSessionIds, function (error) {
          suite.thywills[0].channelManager.clear(testChannelId, function (error) {
            // Do nothing.
          });
        });
      },
      "emit happened": function (channelId, sessionIds) {
        assert.isArray(sessionIds);
        assert.deepEqual(sessionIds.sort(), testSessionIds);
        assert.strictEqual(channelId, testChannelId);
      }
    }
  });
  suite.addBatch({
    "channelManager#getSessionIds still empty in other process": {
      topic: function () {
        suite.thywills[1].channelManager.getSessionIds(testChannelId, this.callback);
      },
      "empty array returned": function (error, sessionIds) {
        assert.equal(error, null);
        assert.deepEqual(sessionIds, []);
      }
    }
  });
};
