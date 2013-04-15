Vows Tests
==========

The various tests for Thywill are defined as Vows test suites.

/test/applications
------------------

Tests under /test/application launch one or more Thywill instances, with each
instance in its own child process, running one of the example applications
found under /applications/*.

The tests may use one or multiple clustered instances, and may use Express or
Redis for session management, depending on which of the example applications is
being tested.

  * These are end-to-end web and socket tests using a client.
  * Some of the tests rely on the presence of a local Redis server.

/test/base
----------

Tests under /test/base each launch a single non-clustered Thywill instance that
uses in-memory component implementations, a vanilla http.Server rather than
Express, and no session management.

  * The Thywill instance is headless - it does not run applications.

/test/cluster
-------------

Tests under /test/cluster each launch multiple clustered Thywill instances that
use Redis-based component implementations, Express applications rather than
vanilla http.Server instances, and session management via Express and Redis.

  * These clustered Thywill instances all run in a single process.
  * The Thywill instances are headless - they do not run applications.
  * The test suites rely on the presence of a local Redis server.

Notes on a Blocking Socket.IO / Redis Store Issue
-------------------------------------------------

Socket.IO has issues on connecting when:

  * Multiple Thywill instances are running in a single process, and
  * The Redis-backed socket store is used.

When this is the case, attempts to connect via Socket.IO hang indefinitely - it
seems because the "connection" event on the server fails to fire in the correct
namespace. All the rest of the connection code works.

This is largely why Thywill example application tests run in child processes.
