Thywill: a Framework for Secure Asynchronous Message Applications
=================================================================

Thywill is a Node.js framework for building a particular type of single-page
web application:

  * Based on asynchronous messaging
  * All traffic is sent encrypted over SSL
  * Uses Socket.IO as a communication layer

In Thywill, messages can be passed at any time between connected web clients
and the server, initiated by either the client or the server.

Example Applications
--------------------

You can manually run the simplest example Thywill application, Echo, as
follows:

    cd path/to/thywill
    node ./applications/echo/service/start.js

Navigate to the following URL on your server to see it in action.

    http://example.com:10080/echo/

Then read /doc/applicationServiceSetup.md for instructions on how to set up a
Thywill application as a service.

Go on to read /doc/serverSetup.md for instructions on how to set up a server
with an SSL-capable proxy so as to run a Thywill application securely via HTTPS
connections. With that built, you can access Echo as follows:

    https://example.com/echo/

Building New Thywill Applications
---------------------------------

A Thywill application is any Node.js code that implements the necessary
interface to:

  * Send and receive messages through Thywill
  * Add Javascript, CSS, and other resources to be loaded by a client

The example applications found under /applications demonstrate how this is
accomplished by extending the Application class.

Beyond this minimum, a Thywill application can contain any arbitrary code. It
does its thing, while Thywill manages the message transport between server and
client.

A Work in Progress
------------------

Thywill is very much a work in progress, proceeding at a sedate pace. It
remains skeletal at this time, with much to be done. Nonetheless, the core
functions - it is possible to write applications on top of Thywill, should
you so feel the urge.

You will want to read through the material in /doc, and if interested take
a look at the example applications in /applications.
