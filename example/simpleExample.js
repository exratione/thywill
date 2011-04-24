/**
 * An example of a thywill HTTP server, using a very simple configuration.
 */

var thywill = require("thywill.js");

/*
 * Start up an HTTP server.
 */ 


/*
 * Use the default configuration file in /config/thywill.json. Configuration methods
 * for thywill are synchronous, even when reading from file.
 */ 
thywill.configureFromFile();

/*
 * Start thywill running. This is an asynchronous call. 
 * 
 * We can either pass thywill.startup() a callback function that will be invoked when startup is complete,
 * with an argument that is a reference to the thywill object for convenience, or we can listen for the 
 * "thywill.ready" event elsewhere in our code. Here we are passing a callback.
 */
thywill.startup(function(thywill) {
  

  //TODO now add a small app: listener plus static paths on the http server
  
  
  
  
  
});


