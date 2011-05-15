/*
 * An example of a thywill HTTP server, using a very simple configuration and a proof of concept application.
 * All this does is echo messages submitted back to the client.
 * 
 * When running, navigate to /thywill on the server to see it in action.
 */

var http = require("http");
var thywill = require("thywill");
var EchoAppClass = require("../lib/apps/echo");

/*
 * Start up an HTTP server. Note that this will need sufficient privileges to 
 * bind to the privileged port 80. E.g. you are running the script while logged
 * in as root or through sudo via something like:
 * 
 * sudo /full/path/to/node /full/path/to/simpleExample.js
 */ 
var server = http.createServer(function(req, res) {
  res.writeHead(200, { "Content-Type": "text/html"}); 
  res.end("Echo Test");   
});
server.listen(80);

/*
 * Drop the permissions of the process now that the port is bound by switching ownership
 * to another user who still has sufficient permissions to access the needed scripts.
 * 
 * Replace the username below with your lower-permissions node user
 * and uncomment the line.
 */
// process.setguid("node");

/*
 * Then define your application object and callback function:
 */
var echoApp = new EchoAppClass("my echo application");
var callback = function(error) { 
  if( error ) {
    console.log("Error while launching thywill.js: " + error);
  } else {
    console.log("thywill.js is ready.");
  };
};

/*
 * Use the default configuration file in /config/thywill.json. Configuration methods
 * for thywill are synchronous, even when reading from a file.
 */ 
thywill.configureFromFile();

/*
 * Start thywill running. This is an asynchronous call. 
 * 
 * We can either pass thywill.startup() a callback function that will be invoked when startup is complete,
 * with an argument that is a reference to the thywill object for convenience, or we can listen for the 
 * "thywill.ready" event elsewhere in our code. Here we are passing a callback.
 * 
 * The callback has the form function(error), where error == null on a successful startup.
 */
thywill.startup(server, echoApp, callback);


