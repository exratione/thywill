Developer Deploy Script
-----------------------

The contents of /deploy are intended to be used on a developer workstation
(Windows with Cygwin or on a Linux based machine) to push changes to a remote
server. This is no substitute for a formal deployment process, and is intended
to be used during the early stages of development only.

This is a crude rsync-based deploy script, and on some versions and
configurations of Windows, you must run Cygwin as the system administrator -
i.e. to be able to make the necessary socket connections. In order to use the
deploy script, create a file /deploy/environment. Put the following lines into
that file, replacing the paths and servers as necessary:

    #!/bin/bash
    # Don't forget the trailing slash on the source directory - if you miss it
    # than the directory rather than its contents will be copied.
    export DEPLOY_SOURCE_DIR=/cygdrive/c/code/thywill.js/
    export DEPLOY_DEST_DIR=/home/node/thywill.js
    export DEPLOY_SERVER=my.server.com
    export DEPLOY_ACCOUNT=reason
    export DEPLOY_KEY=/path/to/ssh/key

DEPLOY_KEY is optional. If not present, login will be via entering a password.

To deploy, run the /deploy/deploy script: it will read in the environment
file and execute rsync to copy files to the specified server.
