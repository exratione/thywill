Changelog
=========

v0.0.10 - 06/23/2013
--------------------

  * Fix fatal bugs in HttpCluster and SocketIOClientInterface components.
  * Refactor client code in the SocketIoClientInterface to be less silly.


v0.0.9 - 04/15/2013
-------------------

  * Expanded test coverage to applications with web/socket client tests.
  * Crucial bugfixes for sessions in SocketIoExpressClientInterface and in test code.
  * Improved readability of example application start scripts.

v0.0.8 - 04/06/2013
-------------------

  * Removed Varnish/Stunnel frontend option.
  * Removed client tracking functionality from ClientInterface component.
  * Created ClientTracker component and in-memory implementation.
  * Added rudimentary dependency declaration in component implementations.
  * Removed the MessageManager and refactored sending interface for simplicity.
  * Replaced connection ID and session ID parameters with Client instances.
  * Refactored SocketIoClientInterface to create SocketIoExpressClientInterface.

v0.0.7 - 04/01/2013
-------------------

  * Reworked Redis client protection.
  * Additional non-core components can be specified in configuration without any core code changes.
  * Remove minified flag from Resource class; the minifier checks the path/filename instead.
  * A start on defaulting Resource type by file extension.
  * Session ID added to messages arriving from the client.
  * ServerMessages can be configured for delivery to a client session (possibly multiple connections).
  * ChannelManager non-core component added, with RedisChannelManager implementation.
  * Chat example application added to illustrate the use of channels.
  * jQuery updated to 1.9.1.

v0.0.6 - 03/10/2013
-------------------

  * First public release.
