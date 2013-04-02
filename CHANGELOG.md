Changelog
=========

Work in Progress
----------------

  * Removed Varnish/Stunnel frontend option.
  * Removed client tracking functionality from ClientInterface component.
  * Created ClientTracker component and in-memory implementation.
  * Added rudimentary dependency declaration in component implementations.

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
