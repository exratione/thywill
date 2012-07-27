Setting Up a Thywill Application as a Service
---------------------------------------------

The example applications in /applications come with scripts to set them up as
services on a Linux server. This document outlines how to go about setting
up a Thywill application as a service.

Assumptions
-----------

The example scripts makes some assumptions about the Node.js server setup
are using, expecting you to have followed the instructions in 
/doc/server-setup.md:

  * You have installed Node.js on some variety of Linux
  * There is a user "node" with a home directory /home/node
  * Node.js is installed in /home/node/local

If your Node.js installation differs, you will have to change (at a minimum)
some of the paths in the various scripts used here.

Service Setup With an Init.d Script on Fedora, Red Hat, Etc.
------------------------------------------------------------

Running as a service on Fedora, Red Hat, and similar Linux distributions is
best accomplished through the Forever package. After building your server as
described in /doc/server-setup.md, install Forever globally via NPM:

    npm -g install forever

Then take the following steps:

  * Install the Thywill package if you haven't done so already
  * Copy the init.d script for the application to /etc/init.d
  * Make sure the script has sufficient permissions to run as a service script
  * Make sure that the paths in the script are correct

You can now use the init.d script to start and stop a Node.js process that runs
the application:

    /etc/init.d/my-application start
    /etc/init.d/my-application stop

Service Setup With Upstart
--------------------------

Most Linux distributions can use Upstart to manage a Thywill application as a
service. Ubuntu has Upstart installed by default. After building your server
as described in /doc/server-setup.md, take the following steps:

  * Install the Thywill package if you haven't done so already
  * Copy the upstart script to /etc/init
  * Make sure the script has permissions of 0644
  * Make sure that the paths in the script are correct

You can now use upstart to start and stop a Node.js process that runs the
application:

    start my-application
    stop my-application
