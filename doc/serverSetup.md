Thywill Server Setup for Ubuntu
-------------------------------

This document outlines the setup and configuration of a Thywill server on
Ubuntu:

  * Each Thywill application runs as a separate Node.js process
  * Each Node.js process runs as a service
  * Varnish and Nginx proxies pass traffic to Thywill applications

The starting point for the purposes of this guide is a bare bones Ubuntu 12.04
server - it probably won't even have your favorite text editor installed at the
outset.

Install Node.js
---------------

First install the packages required by Node.js:

    apt-get install python openssl openssl-devel gcc-c++ make

Next create a user to run Node.js and switch to that user:

    useradd m -d /home/node node
    su - node

Then install and build the latest version of node.js in the node user home
directory. You'll want to have the node.js source downloaded and unpacked
(or checked out from Github) into /home/node/node and owned by the node user.
Then:

    cd /home/node/node
    export JOBS=2
    mkdir ~/local
    ./configure --prefix=$HOME/local/node
    make
    make install
    
Lastly, you will need to add the node executables to the PATH environment
variable and set the NODE_PATH such that Node.js can see modules in the main
node_modules library folder. You should probably set this up for all users, 
which can be done as follows.

Create the file /etc/profile.d/node.sh containing the following lines:

    export PATH=/home/node/local/node/bin:$PATH
    export NODE_PATH=/home/node/local/node/lib/node_modules

Depending on your setup, you may instead need to create the file 
/etc/profile.d/node.csh containing the following lines:

    setenv PATH /home/node/local/node/bin:$PATH
    setenv NODE_PATH /home/node/local/node/lib/node_modules

Node User Permissions
---------------------

Depending on what you want to do with Node.js (e.g. bind to privileged
ports < 1024), you may want to allow the node user to be able to use sudo. In
Ubuntu, add a file "node" into /etc/sudoers.d which should contain the
following line:

    node        ALL=(ALL)       NOPASSWD: ALL

For a production server, you would probably want to constrain the node user's
options a little more than the blanket sudo access above.

Install Thywill
---------------

Installing through NPM will automatically install the necessary dependencies.

    npm install thywill
    
If setting up for development on Thywill, then you instead should clone the
repository and then use NPM to link it locally, allowing you to update the
code but still otherwise treat it as an installed package.

    cd /home/node
    git clone git://github.com/exratione/thywill.git
    cd thywill
    npm link
    
Set Up a Thywill Application to Run as a Service
------------------------------------------------

To set up an application as a service, follow the instructions in the
readme file contained in the application's service directory. The service
directory will typically contain the following items:

  * Start Node.js script
  * Shutdown preparation Node.js script
  * Service script that will have to be copied or symlinked to /etc/init.d
  * Default configuration JSON file
  * Readme file containing setup instructions
  
The service script files contain paths to various files in the Thywill
directories. These will only be correct if Node.js is installed as described in
this document - otherwise they must be edited in order for the scripts to work.

Proxy Server Arrangement
------------------------

The following arrangement of server processes is used:

  * Varnish on port 80/443
  * Nginx on port 8080
  * Thywill Node.js applications on ports 10080+
  
Prior to version 1.3, Nginx cannot pass websocket traffic as a proxy, so
Varnish is the frontend proxy. It passes websocket traffic directly to
the appropriate Node.js backends, and all other requests to Nginx.

Nginx then passes requests to Node.js for non-websocket traffic and serves
static files, as appropriate.
  
Set Up Varnish
--------------

First, install Varnish:

    apt-get install varnish
   
Next, set up the configuration as required for your server scenario. A default
configuration suitable for any of the example applications is provided in:

    /server-config/varnish/thywill-default.vcl
    
Copy the contents into your Varnish configuration file /etc/varnish/default.vcl.
Note that this configuration is far from suitable for production use - it is an
example only, and omits most of the useful things that Varnish can do.

Set Up Nginx
------------

First, install Nginx:

    apt-get install nginx
    
Next, set up the configuration as required for your server scenario. A default
configuration suitable for any of the example applications is provided in:

    /server-config/nginx/thywill-nginx.conf
    
Copy the contents into your Nginx configuration file.







