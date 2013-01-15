/**
 * @fileOverview
 * Message class definition.
 *
 * This is shared with the front end, so watch out for inclusion of references
 * that won't work in that environment: this has to be very self-contained.
 */

// Defined out here so that it isn't passed to the front end with the class
// definition.
var window;

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A Message instance wraps data for delivery between client and server.
 *
 * Construct messages using MessageManager implementations.
 */
function Message () {
  // Metadata.
  this._ = {};
}
var p = Message.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

Message.ORIGINS = {
  SERVER: "server",
  CLIENT: "client"
};

Message.DESTINATIONS = Message.ORIGINS;

Message.METADATA = {
  // The ID of the specific client connection, either as sender or recipient.
  CONNECTION_ID: "cid",
  // Whether the message is delivered to server or client.
  DESTINATION: "dest",
  // The ID of the originating application.
  FROM_APPLICATION: "faid",
  // The ID of the destination application. If not set, the message is for
  // delivery to all applications.
  TO_APPLICATION: "taid",
  // Whether the message originated from server or client.
  ORIGIN: "orig",
  // Used to identify messages with replies or otherwise distinguish
  // between messages where important. Not particularly unique.
  IDENTIFIER: "id",
  // The type of the message.
  TYPE: "type"
};

Message.TYPES = {
  NONE: undefined
};

//-----------------------------------------------------------
// Methods: getters and setters
//-----------------------------------------------------------

/**
 * Getter for message contents.
 */
p.getData = function () {
  return this.data;
};

/**
 * Setter for message data.
 */
p.setData = function (data) {
  this.data = data;
};

/**
 * Getter for message data. Usage:
 *
 * getMetadata() => object
 * getMetadata(name) => value
 */
p.getMetadata = function () {
  if (typeof arguments[0] === "string") {
    return this._[arguments[0]];
  } else {
    return this._;
  }
};

/**
 * Setter for message metadata. Usage:
 *
 * setMetadata(object);
 * setMetadata(name, value);
 */
p.setMetadata = function () {
  if (!arguments[0]) {
    return;
  }
  var type = typeof arguments[0];
  if (type === "object") {
    this._ = arguments[0];
  } else if (type === "string" && arguments.length > 1) {
    this._[arguments[0]] = arguments[1];
  }
};

//-----------------------------------------------------------
// Methods: utilities
//-----------------------------------------------------------

/**
 * Return a JSON string representing this object.
 *
 * @return {string}
 *   A JSON string representing this instance.
 */
p.toString = function () {
  return JSON.stringify(this);
};

/**
 * Determine whether this message is valid: it has data and the required
 * metadata is populated.
 *
 * Messages created on the client for sending to the server lack a
 * connectionId, origin, and destination metadata.
 *
 * @return {boolean}
 *   True if this instance is a valid message.
 */
p.isValid = function () {
  if (!this.getMetadata(Message.METADATA.TO_APPLICATION)) {
    return false;
  }
  if (!this.getMetadata(Message.METADATA.FROM_APPLICATION)) {
    return false;
  }
  if (!this.getData()) {
    return false;
  }

  var origin = this.getMetadata(Message.METADATA.ORIGIN);
  if (!origin) {
    return false;
  }
  var validOrigin = Object.keys(Message.ORIGINS).some(function (key, index, array) {
    return (Message.ORIGINS[key] === origin);
  });
  if (!validOrigin) {
    return false;
  }
  var destination = this.getMetadata(Message.METADATA.DESTINATION);
  if (!destination) {
    return false;
  }
  var validDestination = Object.keys(Message.DESTINATIONS).some(function (key, index, array) {
    return (Message.DESTINATIONS[key] === destination);
  });
  if (!validDestination) {
    return false;
  }

  // Server-side only
  if (!window) {
    // A message to or from the client has to have a connection ID.
    if (origin === Message.ORIGINS.CLIENT || destination === Message.DESTINATIONS.CLIENT) {
      if(!this.getMetadata(Message.METADATA.CONNECTION_ID)) {
        return false;
      }
    }
  }

  return true;
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Message;
