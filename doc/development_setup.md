thywill.js Development Setup
----------------------------

Clone the Repository
------------------------

Get it from github: 

https://github.com/exratione/thywill-js

Install Eclipse
---------------

Install a new clean slate copy of Eclipse, and set it up for development per the instructions at:

https://github.com/joyent/node/wiki/Using-Eclipse-as-Node-Applications-Debugger

This installs the Google Chrome Developer Tools, which means you can debug with V8, the Javascript engine.

Then add a Javascript editor you like. e.g.:

http://amateras.sourceforge.jp/cgi-bin/fswiki_en/wiki.cgi?page=EclipseHTMLEditor

Or use the default package in Eclipse, which is installed through the IDE:

  * "Help" > "Install New Software" Choose to work with the site for your version of eclipse.
  * Expand "Web, XML and Java EE development", check "Javascript Development Tools" and "Web Page Editor" and click Next to continue with the install

Creating a Project
------------------

  * "File" > "New" > "Other..."
  * From the options, open the JavaScript folder, and select "JavaScript Project"
  * For the project root directory, choose the root directory of the repository clone

Install Node.js and NPM
-----------------------

See the thywill server setup documentation in /doc/thywill-js-server-setup.md if you're working on a Linux machine. Otherwise refer to:

http://nodejs.org
http://npmjs.org/

Link the thywill.js Repository Codebase
--------------------------------------- 

In the upper repository directory, run:

    npm link

This effectively installs the repository code as the module, and changes made to the code will reflect immediately when you run it. See the NPM documentation for more:

https://github.com/isaacs/npm/blob/master/doc/link.md