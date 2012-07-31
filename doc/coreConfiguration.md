Thywill Core Configuration JSON
-------------------------------

At launch, Thywill requires an object or JSON representation of its core
configuration parameters. This applies only to the core components (e.g.
ClientInterface, Log, etc), specifying which implementations to use and the
configuration for each specific implementation. 

An applications is expected to be configured via its own chosen methodology
rather than via the core Thywill configuration.

Thywill is typically launched from a Node.js script in this way:

    // Omitting setup of application, server, and callback variables.
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

Specifying a Non-Core Component Implementation
----------------------------------------------

The normal format for specifying a core component implementation is as follows:

    componentName: {
      implementation: {
        type: "core",
        name: implementationName
      }
    }
    
So for the default log:

    log: {
      implementation: {
        type: "core",
        name: "console"
      }
    }
    
But what about an implementation provided by some other package? That is
specified as follows, where the "property" property is optional:

    componentName: {
      implementation: {
        type: "package",
        name: packageName,
        property: propertyName
      }
    }
    
Under the hood, Thywill expects a constructor for the component class from one
of the following, depending on whether "property" is specified.

    // No property specified.
    require(packageName);
    // Property specified.
    require(packageName).propertyName;

