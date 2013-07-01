Tabular Application
===================

This is a trivial demonstration application that shows how to integrate
Thywill with a single page application framework like AngularJS. The strategy
for the client-side Javascript illustrated here is to perform the following
operations in order:

  * Set up the Thywill ApplicationInterface instance
  * Set up your AngularJS application
  * Listen for events on the ApplicationInterface inside AngularJS controllers

This implementation is specific to AngularJS, but the same sort of approach
works for all frameworks: obtain a reference to the ApplicationInterface and
listen for events within your framework code.

Start the application manually as follows:

    node /applications/tabular/service/startTabular.js

Read /docs/applicationServiceSetup.md for instructions on how to set up the
application to run as a service.
