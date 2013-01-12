Thywill Core Configuration
--------------------------

At launch, Thywill requires an object representation of its configuration
parameters. This specifies which component implementations to use and the
configuration for each specific implementation.

An application written to on top of Thywill is expected to be configured via
its own chosen methodology rather than through the Thywill configuration
object.

Thywill is typically launched from a Node.js script in this way:

    // Load configuration.
    var config = require("./path/to/config/file");
    // Add, at minimum, a server, but more likely an Express application
    // and some other odds and ends to the configuration:
    config.clientInterface.server.server = http.createServer().listen(10080);
    // Create and configure an application.
    var application = new ExampleApplication();
    // Launch!
    Thywill.launch(config, application, function (error, thywill) {
      // Respond to completed launch.
    });

The config variable is a Javascript object containing various other nested
objects and properties. Each example application contains a commented
configuration file as a part of its service scripts. See, for example:

    /applications/echo/service/thywillConfig.js

The comments in this example should adequately explain the format.

Specifying a Component Implementation
-------------------------------------

The normal format for specifying a /core component implementation is as follows:

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

Implementations under /extra are loaded as follows:

    componentName: {
      implementation: {
        type: "extra",
        name: implementationName
      }
    }

But what about an implementation provided by some other package or file? That
is specified as follows, where the "property" property is optional:

    componentName: {
      implementation: {
        type: "require",
        path: path,
        property: property
      }
    }

Under the hood, Thywill expects a constructor for the component class from one
of the following, depending on whether or not "property" is specified.

    // No property specified.
    require(path);
    // Property specified.
    require(path).property;

