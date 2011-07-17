Echo Application Example
------------------------

Assumptions
-----------

The code in this example makes some assumptions about the Node.js setup:

  * You have installed Node.js on Linux under a user "node" and run node processes as that user
  * Node.js is installed in /home/node/local
  * Forever is installed globally via NPM (i.e. "npm -g install forever")

If your Node.js installation differs, you will have to change (at a minimum) some of the paths in the init.d script contained in /example/echo/initdScript.txt.

Setup
-----

  * Install the thywill package
  * Copy the initdScript.txt file to /etc/init.d/thywillechoexample
  * Give it sufficient permissions and ownership to run as a service script
  * Make sure that the paths in /etc/init.d/thywillechoexample are correct

You can now use the init.d script to start and stop this trivial example thywill server application.

Testing in the Browser
----------------------



Further Reading
---------------
  
A longer and much more comprehensive description of the assumptions and setup used here can be found at:

http://www.exratione.com/2011/07/running-a-nodejs-server-as-a-service-using-forever.php