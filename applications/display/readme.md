Display Application
===================

This is a trivial pub/sub message application that displays the communications
taking place between cluster member processes on the server as clients connect
and disconnect, or the server processes go down and come back up again.

Start the two Node.js application processes manually as follows:

    node /applications/draw/service/startDisplayAlpha.js
    node /applications/draw/service/startDisplayBeta.js

Read /docs/applicationServiceSetup.md for instructions on how to set up these
application processes to run as a service. There are two possible approaches:
either one service script starts and stops both processes, or each process has
its own service script.

This application requires a Redis server to be running on the same local
machine as the Node.js processes.
