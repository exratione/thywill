Vows Tests
==========

The various tests for Thywill are defined as Vows test suites.

/test/base
----------

Tests under /test/base each launch a single non-clustered Thywill instance that
uses in-memory component implementations, a vanilla http.Server rather than
Express, and no session management.

/test/cluster
-------------

Tests under /test/cluster each launch multiple clustered Thywill instances that
use Redis-based component implementations, Express applications rather than
vanilla http.Server instances, and session management via Express and Redis.

These test suites rely on the presence of a local Redis server.
