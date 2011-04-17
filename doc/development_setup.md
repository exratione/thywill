thywill.js Development Setup
----------------------------

Install Eclipse
---------------

Install a new clean slate copy of Eclipse, and set it up for development per the instructions at:

https://github.com/joyent/node/wiki/Using-Eclipse-as-Node-Applications-Debugger

This installs the Google Chrome Developer Tools, which means you can debug with V8, the Javascript engine.

Then add a Javascript editor you like. e.g.:

http://amateras.sourceforge.jp/cgi-bin/fswiki_en/wiki.cgi?page=EclipseHTMLEditor

Or use the default package in Eclipse, which is installed through the application:

  * "Help" > "Install New Software" Choose to work with the site for your version of eclipse.
  * Expand "Web, XML and Java EE development", check "Javascript Development Tools" and click Next to continue with the install

Creating a Project
------------------

  * "File" > "New" > "Other..."
  * From the options, open the JavaScript folder, and select "JavaScript Project"