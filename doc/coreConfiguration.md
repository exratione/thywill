Thywill Core Configuration JSON
-------------------------------

At launch, Thywill requires an object or JSON representation of its core
configuration parameters. This applies only to the core components (e.g.
ClientInterface, Log, etc), specifying which implementations to use and the
configuration for each specific implementation. 

An applications is expected to be configured via its own chosen methodology
rather than via the core Thywill configuration.

Thywill is typically launched from a Node.js script in this way:

    //
    // Omitting setup of application, server, and callback variables
    //
    // Load configuration.
    var config = require("./path/to/config");
    // Launch!
    Thywill.launch(config, application, server, callback);
    
The config variable is a Javascript object containing various other nested 
objects and properties.

Each example application contains a commented configuration file as a part of
its service scripts. See, for example:

    /applications/echo/service/thywillConfig.js

These examples should adequately explain the format.