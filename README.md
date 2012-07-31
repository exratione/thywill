Thywill
-------

Thywill is a Node.js framework for building a particular type of single-page
web application:

  * Based on asynchronous messaging
  * All traffic is sent over SSL

In Thywill, messages can be passed at any time between connected web clients 
and the server, whether they originate with the client or the server. This is
by default achieved using websockets.

Thywill Applications
--------------------

A Thywill application is any Node.js code that implements the necessary
interface to:

  * Send and receive messages through Thywill
  * Add Javascript, CSS, and other resources for loading when a client connects

The example applications demonstrate how this is accomplished by extending the
Application class.

A Work in Progress
------------------

Thywill is very much a work in progress, proceeding at a sedate pace. It
remains skeletal at this time, with much to be done. Nonetheless, the core
functions - it is possible to write applications on top of Thywill, should
you so feel the urge.

You will want to read through the material in /doc, and if interested take
a look at the example applications in /applications.