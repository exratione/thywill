Shapes Application
------------------

This application provides an interface for a user to select and place shapes on
a canvas. It demonstrates staggered creation and delivery of resources (e.g.
images) to the client.

Static content is served by Express rather than Thywill, and Express sessions
are persisted in memory only.

Start the application manually as follows:

    node /applications/shapes/service/start.js

Read /docs/applicationServiceSetup.md for instructions on how to set up the
application to run as a service.
