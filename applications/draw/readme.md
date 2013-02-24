Draw Application
================

This is a trivial pub/sub message application that allows multiple users to
draw lines on a canvas. Any one client's activity is visible to every client.

The application illustrates the use of multiple Redis-backed Node.js processes
running clustered in the backend, running on a single server behind a proxy.
User connections may be directed to any one of the processes.

Start the four Node.js application processes manually as follows:

    node /applications/draw/service/startDrawAlpha.js
    node /applications/draw/service/startDrawBeta.js
    node /applications/draw/service/startDrawGamma.js
    node /applications/draw/service/startDrawDelta.js

Read /docs/applicationServiceSetup.md for instructions on how to set up these
application processes to run as a service. There are two possible approaches:
either one service script starts and stops all four processes, or each process
has its own service script.

This application requires a Redis server to be running on the same local
machine as the Node.js processes.
