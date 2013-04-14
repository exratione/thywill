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

// TODO: switch around paths and prefixes in config to be test.

service.start(config);
