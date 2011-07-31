Developer Deploy Script
-----------------------

The contents of this directory are intended to be used and edited on Windows with Cygwin, or on a Linux based machine, 
to push changes from a developer's machine to a remote development server.

This is a crude rsync-based deploy script, and so on some versions and configurations of Windows, you must run Cygwin as 
the system administrator - i.e. to be able to make the necessary socket connections. In order to use the deploy script, 
you must create a file /deploy/environment. Put the following in the file, replacing the paths and servers as necessary:

    #!/bin/bash
    export THYWILL_SOURCE_DIR=/cygdrive/c/code/thywill.js
    export THYWILL_DEST_DIR=/home/node/thywill.js
    export THYWILL_SERVER=my.server.com
    export THYWILL_ACCOUNT=reason
    export THYWILL_KEY=/path/to/ssh/key
    
Then to deploy, use the deploy/deploy script which will read in the environment file and run rsync to copy over updates to
the codebase to the specified server.
