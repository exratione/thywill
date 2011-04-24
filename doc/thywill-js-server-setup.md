thwyill.js Server Setup
-----------------------

This document outlines one possible configuration for a secure thywill.js server.

Server
------

We will use a very bare bones Amazon AWS server for the purposes of this document - it probably won't even have your favorite text editor.

Starting point: Fedora Core 14
AWS AMI: ami-225aac4b

Install necessary packages
--------------------------

    yum install python openssl openssl-devel gcc-c++ make

Install node.js
---------------

Create a user to run node.js:

    useradd -d /home/node node
    su - node

Then install and build the latest version of node.js in the node user home directory by following the instructions at:

  * http://node.js
  * https://github.com/joyent/node/wiki/Installation

There is no package available for Fedora through package managers at the time of writing.

Install NPM
-----------

NPM is a package manager for node.js libraries. Run the following as the node user:

    curl http://npmjs.org/install.sh | sh

This will put NPM into the node installation in /home/node/local/node, under /home/node/local/node/bin 

Add Paths to PATH
-----------------

To add the path to node.js and NMP to the system path for every user, create the file /etc/profile.d/node.sh and add this to it:

    export PATH=/home/node/local/node/bin:$PATH

And put this into /etc/profile.d/node.csh

    setenv PATH /home/node/local/node/bin:$PATH

Install thywill.js
------------------

Installing through NPM will automatically install the necessary dependency chains.

    npm install thywill










