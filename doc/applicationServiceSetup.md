Setting Up a Thywill Application as a Service
---------------------------------------------

Any of the example applications in /applications can be set up to run as a
service by adapting one of the example upstart or init.d scripts found in
the /serverConfig/thywill directory. The scripts contain example settings
for the Echo application, which can be easily changed for one of the other
example applications, or for one of your own applications.

This document outlines how to go about setting up a Thywill application as a
service.

Assumptions
-----------

The example settings make some assumptions about the Node.js server setup
are using, expecting you to have followed the instructions in
/doc/server-setup.md:

  * You have installed Node.js on some variety of Linux
  * There is a user "node" with a home directory /home/node
  * Node.js is installed in /home/node/local/node
  * You have installed Forever globally (see below)

If your Node.js installation differs, you will have to change some of the
environment variables set in the scripts, such as those pointing to Node.js or
Forever binaries. This is not hard to do, and the scripts are in any case
well enough documented for you to find your way.

Install Forever Globally
------------------------

The scripts all make use of Forever as a process monitor and utility for
managing Node.js services. After building your server as described in
/doc/server-setup.md, install Forever globally via NPM:

    npm -g install forever

Option 1: init.d on RPM-based Linux
-----------------------------------

Running as a service on Fedora, Red Hat, and similar RPM-based Linux
distributions is easy enough. Take the following steps:

  * Install the Thywill package if you haven't done so already
  * Copy /serverConfig/thywill/thywill-fedora-initd to /etc/init.d
  * Rename the script to something appropriate for your application
  * Make sure the script has suitable exec permissions
  * Edit the script to set the paths and other environment variables

You can now use the new init.d script to start and stop a Node.js process that runs
the application. If your script is my-thywill-application, then:

    /etc/init.d/my-thywill-application start
    /etc/init.d/my-thywill-application stop

Option 2: init.d on Debian-based Linux
--------------------------------------

This works in exactly the same way as Option 1 above, but use the script
/serverConfig/thywill/thywill-ubuntu-initd as a basis for your init.d script.

Option 3: Upstart on Debian-based Linux
---------------------------------------

Most Linux distributions can use Upstart to manage a Thywill application as a
service. Ubuntu has Upstart installed by default. After building your server
as described in /doc/server-setup.md, take the following steps:

  * Install the Thywill package if you haven't done so already
  * Copy /serverConfig/thywill/thywill-upstart.conf to /etc/init
  * Rename the script to something appropriate for your application
  * Make sure the script has permissions of 0644
  * Edit the script to set the paths and other environment variables

You can now use upstart to start and stop a Node.js process that runs the
application. If your script is my-thywill-application.conf, then:

    start my-thywill-application
    stop my-thywill-application
