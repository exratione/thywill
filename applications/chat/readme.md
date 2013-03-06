Chat Application
================

This is a trivial chat application that allows visitors to chat one on one.

The application illustrates the use of multiple Redis-backed Node.js processes
running clustered in the backend, running on a single server behind a proxy.
User connections may be directed to any one of the processes. This application
is intended to show off the delivery of messages to a specific client
regardless of which server process sends the message and which server process
the client is connected to.

Start the four Node.js application processes manually as follows:

    node /applications/draw/service/startChatAlpha.js
    node /applications/draw/service/startChatBeta.js
    node /applications/draw/service/startChatGamma.js
    node /applications/draw/service/startChatDelta.js

Read /docs/applicationServiceSetup.md for instructions on how to set up these
application processes to run as a service. There are two possible approaches:
either one service script starts and stops all four processes, or each process
has its own service script.

This application requires a Redis server to be running on the same local
machine as the Node.js processes.
