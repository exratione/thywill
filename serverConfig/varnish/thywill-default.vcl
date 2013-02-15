#
# An example Varnish configuration.
#
# This is not suitable for production use - it is a quick-start example
# intended to help set up Thywill for development and show how Varnish
# can be set up for use with Thywill.
#
# Important note: this configuration disables all Varnish caching! It
# only illustrates how to use Varnish to divide websocket and non-websocket
# traffic arriving at a single port, and sent to off to different backends.
#
# For more comprehensive Varnish configurations that handle additional
# functionality unrelated to Node.js and websockets, but which is
# nonetheless absolutely vital for any serious use of Varnish in a
# production environment, you might look at:
#
# https://github.com/mattiasgeniar/varnish-3.0-configuration-templates/
#

# -----------------------------------
# Backend definitions.
# -----------------------------------

# Nginx.
backend default {
  .host = "127.0.0.1";
  .port = "8080";
  .connect_timeout = 5s;
  .first_byte_timeout = 15s;
  .between_bytes_timeout = 15s;
  .max_connections = 400;
}
# Node.js: Thywill Echo application.
backend thywill_echo {
  .host = "127.0.0.1";
  .port = "10080";
  .connect_timeout = 1s;
  .first_byte_timeout = 2s;
  .between_bytes_timeout = 15s;
  .max_connections = 400;
}
# Node.js: Thywill Shapes application.
backend thywill_shapes {
  .host = "127.0.0.1";
  .port = "10081";
  .connect_timeout = 1s;
  .first_byte_timeout = 2s;
  .between_bytes_timeout = 15s;
  .max_connections = 400;
}
# Node.js: Thywill Calculations application.
backend thywill_calculations {
  .host = "127.0.0.1";
  .port = "10082";
  .connect_timeout = 1s;
  .first_byte_timeout = 2s;
  .between_bytes_timeout = 15s;
  .max_connections = 400;
}

# -----------------------------------
# Varnish Functions
# -----------------------------------

# Set a local ACL.
acl localhost {
  "localhost";
}

sub vcl_recv {
  # Before anything else, redirect all HTTP traffic arriving from the outside
  # world to port 80 to port 443.
  #
  # This works because we are using Stunnel to terminate HTTPS connections and
  # pass them as HTTP to Varnish. These will arrive with client.ip = localhost
  # and with an X-Forward-For header - you will only see both of those
  # conditions for traffic passed through Stunnel.
  #
  # We want to allow local traffic to access port 80 directly, however - so
  # check client.ip against the local ACL and the existence of
  # req.http.X-Forward-For.
  #
  # See vcl_error() for the actual redirecting.
  if (!req.http.X-Forward-For && client.ip !~ localhost) {
    set req.http.x-Redir-Url = "https://" + req.http.host + req.url;
    error 750 req.http.x-Redir-Url;
  }

  set req.backend = default;
  set req.grace = 30s;

  # Pass the correct originating IP address for the backends
  if (req.restarts == 0) {
    if (req.http.x-forwarded-for) {
      set req.http.X-Forwarded-For = req.http.X-Forwarded-For + ", " + client.ip;
    } else {
      set req.http.X-Forwarded-For = client.ip;
    }
  }

  # Remove any port that might be stuck in the hostname.
  set req.http.Host = regsub(req.http.Host, ":[0-9]+", "");

  # Only deal with "normal" request types.
  if (req.request != "GET" &&
    req.request != "HEAD" &&
    req.request != "PUT" &&
    req.request != "POST" &&
    req.request != "TRACE" &&
    req.request != "OPTIONS" &&
    req.request != "DELETE") {
    /* Non-RFC2616 or CONNECT which is weird. */
    return (pipe);
  }
  # And only deal with GET and HEAD by default.
  if (req.request != "GET" && req.request != "HEAD") {
    return (pass);
  }

  # Pipe websocket connections directly to the relevant Node.js backend.
  if (req.http.Upgrade ~ "(?i)websocket") {
    if (req.url ~ "^/echo/") {
      set req.backend = thywill_echo;
    } elseif (req.url ~ "^/shapes/") {
      set req.backend = thywill_shapes;
    } elseif (req.url ~ "^/calculations/") {
      set req.backend = thywill_calculations;
    }
    return (pipe);
  }
  # Requests made to these paths relate to websockets - pass does not seem to
  # work (even for XHR polling).
  if (req.url ~ "^/echo/socket.io/") {
    set req.backend = thywill_echo;
    return (pipe);
  } elseif (req.url ~ "^/shapes/socket.io/") {
    set req.backend = thywill_shapes;
    return (pipe);
  } elseif (req.url ~ "^/calculations/socket.io/") {
    set req.backend = thywill_calculations;
    return (pipe);
  }

  # Send everything else known to be served by Thywill to the relevant Node.js
  # backend.
  if (req.url ~ "^/echo/") {
    set req.backend = thywill_echo;
  } elseif (req.url ~ "^/shapes/") {
    set req.backend = thywill_shapes;
  } elseif (req.url ~ "^/calculations/") {
    set req.backend = thywill_calculations;
  }

  # Normalize Accept-Encoding header. This is straight from the manual:
  # https://www.varnish-cache.org/docs/3.0/tutorial/vary.html
  if (req.http.Accept-Encoding) {
    if (req.url ~ "\.(jpg|png|gif|gz|tgz|bz2|tbz|mp3|ogg)$") {
      # No point in compressing these.
      remove req.http.Accept-Encoding;
    } elseif (req.http.Accept-Encoding ~ "gzip") {
      set req.http.Accept-Encoding = "gzip";
    } elseif (req.http.Accept-Encoding ~ "deflate") {
      set req.http.Accept-Encoding = "deflate";
    } else {
      # Unkown algorithm.
      remove req.http.Accept-Encoding;
    }
  }

  if (req.http.Authorization || req.http.Cookie) {
    # Not cacheable by default.
    return (pass);
  }

  # If we were caching at all, then this next line would return lookup rather
  # than pass. Return pass disables all caching for all backends.
  # return (lookup);
  return (pass);
}

sub vcl_error {
  # For redirecting traffic from HTTP to HTTPS - see where error 750 is set in
  # vcl_recv().
  if (obj.status == 750) {
    set obj.http.Location = obj.response;
    set obj.status = 302;
    return (deliver);
  }
}

sub vcl_pipe {
  # We need to copy the upgrade header.
  if (req.http.upgrade) {
    set bereq.http.upgrade = req.http.upgrade;
  }
  return (pipe);
}
