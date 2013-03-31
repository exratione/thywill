Changelog
=========

v0.0.6 - 3/10/2013
------------------

First public release.

Work in Progress
----------------

Reworked Redis client protection.
Additional non-core components can be specified in configuration without any core code changes.
Remove minified flag from Resource class; the minifier checks the path/filename instead.
A start on defaulting Resource type by file extension.
Session ID added to messages arriving from the client.
ServerMessages can be configured for delivery to a client session (possibly multiple connections).
ChannelManager non-core component added.
Chat example application added.
jQuery updated to 1.9.1.
