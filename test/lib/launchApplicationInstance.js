/**
 * @fileOverview
 * To be run as a child process by test code to launch one of the example
 * applications, so that it can be accessed by web and socket clients.
 *
 * Usage:
 *
 * node launchApplicationInstance base64encodedArgs
 */

var path = require("path");

// Arguments arrive as a base64 encoded JSON string.
// {
//   application: string
//   port: number
//   clusterMemberId: string
// };
var args = new Buffer(process.argv[2], "base64").toString("utf8");
args = JSON.parse(args);

var service = require(path.join("../../applications", args.application, "lib/service"));
var config = service.getConfig(args.port, args.clusterMemberId);

// Alter config to keep test data distinct from ordinary use of example
// applications.
if (args.application === "chat") {
  config.channelManager.redisPrefix = "test:thywill:chat:channel:";
  config.cluster.redisPrefix = "test:thywill:draw:cluster:";
  config.resourceManager.redisPrefix = "test:thywill:draw:resource:";
} else if (args.application === "draw") {
  config.cluster.redisPrefix = "test:thywill:draw:cluster:";
  config.resourceManager.redisPrefix = "test:thywill:draw:resource:";
} else if (args.application === "display") {
  config.resourceManager.redisPrefix = "test:thywill:draw:resource:";
}

service.start(config, function (error, thywill) {
  if (error) {
    if (error instanceof Error) {
      error = error.stack;
    }
    error = "Thywill launch failed with error: " + error;
    console.error(error);
    process.send("error");
    process.exit(1);
  }

  // Protect the Redis clients from hanging if they are timed out by the server.
  for (var key in config._redisClients) {
    thywill.protectRedisClient(config._redisClients[key]);
  }

  thywill.log.info("Thywill is ready to run cluster member [" + config.cluster.localClusterMemberId + "].");
  process.send("complete");
});
