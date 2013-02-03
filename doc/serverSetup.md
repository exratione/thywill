Thywill Server Setup for Ubuntu 12.04
=====================================

This document outlines the setup and configuration of a Thywill server on
Ubuntu, in which Nginx and Node.js act as backend servers to provide static
and dynamic content respectively. There are two options for frontend servers:

1) Stunnel and Varnish

  * All content is served over SSL
  * Stunnel decrypts HTTPS traffic and passes HTTP traffic to Varnish
  * Varnish manages distribution of traffic between Node.js and Nginx backends

2) HAProxy

  * All content is served over SSL
  * HAProxy decrypts HTTPS traffic and passes HTTP traffic to Node.js and Nginx

In either case the backend setup is the same:

  * Nginx serves static files for Thywill
  * Nginx can also be used to serve an unrelated website
  * Each Thywill application runs as a separate Node.js backend process
  * Node.js processes are managed as services

The starting point for the purposes of this guide is a bare bones Ubuntu 12.04
server - it probably won't even have your favorite text editor installed at the
outset.

Backend Setup
=============

Install Node.js
---------------

First install the packages required by Node.js:

    apt-get install python openssl openssl-devel build-essential

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
options a little more than the blanket sudo access above, or not allow sudo
access at all. It isn't even needed for the most common service setups using
init.d or upstart scripts, or when running behind a proxy server such that the
Node.js process won't be binding to a privileged port.

Install Thywill
---------------

Installing through NPM will automatically install the necessary dependencies.

    npm install thywill

If setting up for development on Thywill, then you instead might clone the
repository and then use NPM to link it locally, allowing you to update the
code but still otherwise treat it as an installed package.

    cd /home/node
    git clone git://github.com/exratione/thywill.git
    cd thywill
    npm link

Set Up a Thywill Application to Run as a Service
------------------------------------------------

To set up an application as a service, follow the instructions in
/doc/applicationServiceSetup.md. An applications's service directory will
typically contain the following items:

  * Start Node.js script
  * Shutdown preparation Node.js script
  * Service scripts that will have to be copied /etc/init.d or /etc/init
  * Default configuration Javascript file

The service script files contain paths to various files in the Thywill
directories. These will only be correct if Node.js is installed as described in
this document - otherwise they must be edited in order for the scripts to work.

Set Up Nginx
------------

Nginx will be set up here to serve both normal website content and Thywill
static files in their subfolders. Varnish will split traffic between the two
uses. First, install Nginx:

    apt-get install nginx

Since Nginx will be used to serve static files set out by Thywill applications,
permissions will have to be arranged so that both Node.js processes and Nginx
have access to the portion of the webroot used for these files. There are many
different ways of arranging this, and this is only one of them:

  * Nginx runs as the www-data user and has its webroot in /var/www
  * Thywill applications will write static files to /home/node/thywill-static
  * A symlink runs from /var/www/thywill-static to /home/node/thywill-static
  * The www-data user is given read permission on /home/node/thywill-static

Create the static folder and symlink as root and give them the appropriate
ownership and permissions:

    mkdir /var/www
    chown www-data:www-data /var/www
    mkdir /home/node/thywill-static
    ln -s /home/node/thywill-static /var/www/thywill-static
    chown node:www-data /home/node/thywill-static
    chmod 755 /home/node/thywill-static

There is a very simplistic default site configuration for Nginx on port 8080
in the following location:

    /serverConfig/nginx/thywill-default.conf

Make a backup of /etc/nginx/sites-available/default and the copy the above
configuration file over the original /etc/nginx/sites-available/default. This
should already be symlinked in /etc/nginx/sites-enabled and thus active.

Set up SSL Certificate
======================

You must obtain and upload your SSL certificate and key as a single
concatenated file - key then certificate - for either Stunnel or HAProxy to
use.

If you are working on a development server, then setting up a self-signed
certificate is sufficient. That can be accomplished as follows:

    apt-get install ssl-cert
    make-ssl-cert generate-default-snakeoil --force-overwrite
    cat /etc/ssl/private/ssl-cert-snakeoil.key /etc/ssl/certs/ssl-cert-snakeoil.pem > /etc/ssl/snakeoil.pem

This will create these files:

    /etc/ssl/certs/ssl-cert-snakeoil.pem
    /etc/ssl/private/ssl-cert-snakeoil.key
    /etc/ssl/snakeoil.pem

That third is just the first two concatenated together.

Frontend Option 1: Stunnel and Varnish
======================================

The following arrangement of server processes is used:

  * Stunnel on port 443
  * Varnish on port 80
  * Nginx on port 8080
  * Thywill Node.js applications on ports 10080+

Prior to version 1.3, Nginx cannot pass websocket traffic as a proxy, so
Varnish is the frontend proxy. It passes websocket traffic and other relevant
URLs directly to the appropriate Node.js backends, and remaining traffic to
Nginx.

Varnish doesn't handle SSL traffic, so Stunnel is used to terminate HTTPS
requests and pass them on as HTTP requests to Varnish. It is possible to
distinguish between HTTP connections proxied by Stunnel and HTTP connections
arriving directly from a client: Varnish redirects all such direct HTTP
connections to HTTPS.

Set Up Stunnel
--------------

Varnish cannot manage SSL traffic, so Stunnel is used to field HTTPS traffic.
Install Stunnel as a package:

    apt-get install stunnel

Next set up the Stunnel configuration file as required. An example configuration
is provided in:

    /serverConfig/stunnel/thywill-stunnel4.conf

Copy this into the /etc/stunnel/ directory (each separate *.conf file there
will be used to launch a separate Stunnel process when the Stunnel service
starts). Note that this is probably not going to be suitable for production
use, or for anything other than running the Thywill example applications.

Make sure that the certificate path in the configuration file is correct. If
using your own certificate rather than the snakeoil certificate, it will no
doubt have to be changed.

Lastly you will have to edit /etc/default/stunnel4 to set the following line,
otherwise the process will not start.

    # Change to one to enable stunnel automatic startup
    ENABLED=1

Set Up Varnish
--------------

Install Varnish as a package:

    apt-get install varnish

Next, set up the configuration as required for your server scenario. A default
configuration suitable for any of the example applications is provided in:

    /serverConfig/varnish/thywill-default.vcl

Copy the contents into your Varnish configuration file /etc/varnish/default.vcl.
Note that this configuration is far from suitable for production use - it is an
example only, and omits most of the useful things that Varnish can do.

Now alter these lines in /etc/default/varnish to tell Varnish to run on port 80
rather than the default 6081:

    DAEMON_OPTS="-a :80 \
      -T localhost:6082 \
      -f /etc/varnish/default.vcl \
      -S /etc/varnish/secret \
      -s malloc,256m"

Frontend Option 2: HAProxy
==========================

The following arrangement of server processes is used:

  * HAProxy on port 80 and 443, redirecting HTTP to HTTPS
  * Nginx on port 8080
  * Thywill Node.js applications on ports 10080+

Set Up HAProxy
--------------

HAProxy must be of version 1.5-dev13 or later in order to support both SSL traffic
and websockets. At the time of writing, this means that there is no package install,
and HAProxy must be built from source as follows:

    apt-get install libpcre3 libpcre3-dev libssl-dev
    wget http://haproxy.1wt.eu/download/1.5/src/devel/haproxy-1.5-dev17.tar.gz
    tar -xf haproxy-1.5-dev17.tar.gz
    cd haproxy-1.5-dev17
    make TARGET=linux2628 USE_PCRE=1 USE_OPENSSL=1 USE_ZLIB=1
    make install
    useradd haproxy
    mkdir /etc/haproxy

Now copy the provided init.d script to /etc/init.d/haproxy. It is found at:

    /serverConfig/haproxy/haproxy-initd

Copy the configuration file provided to /etc/haproxy/haproxy.cfg. It is found at:

    /serverConfig/haproxy/thywill-haproxy.cfg

Make sure that the certificate path in the configuration file is correct. If
using your own certificate rather than the snakeoil certificate, it will no
doubt have to be changed.

Create a file /etc/default/haproxy with the following contents:

    # Set ENABLED to 1 if you want the init script to start haproxy.
    ENABLED=1
    # Add extra flags here
    # EXTRAOPTS="-de -m 16"

You must update the service definitions:

    cd /etc/init.d
    update-rc.d haproxy defaults

Set Up HAProxy Logging
----------------------

HAPRroxy logs to a UDP port expecting to be accepted by rsyslog - which doesn't
listen by default. So uncomment these lines in /etc/rsyslog.conf:

    # provides UDP syslog reception
    $ModLoad imudp
    $UDPServerAddress 127.0.0.1
    $UDPServerRun 514

Create the file /etc/rsyslog.d/30-haproxy.conf and put this in it:

    local1.* -/var/log/haproxy_1.log
    & ~

Lastly, set up log rotation by creating /etc/logrotate.d/haproxy:

    /var/log/haproxy*.log{
        rotate 4
        weekly
        missingok
        notifempty
        compress
        delaycompress
        sharedscripts
        postrotate
            reload rsyslog >/dev/null 2>&1 || true
        endscript
    }

And restart the rsyslog service:

    restart rsyslog
