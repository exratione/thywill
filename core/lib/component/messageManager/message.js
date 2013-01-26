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
  // Used to identify messages with replies or otherwise distinguish
  // between messages where important. Not particularly unique.
  IDENTIFIER: "id",
  // Whether the message originated from server or client.
  ORIGIN: "orig",
  // The ID of the destination application. If not set, the message is for
  // delivery to all applications.
  TO_APPLICATION: "taid",
  // The type of the message.
  TYPE: "type"
};

Message.TYPES = {
  NONE: undefined,
  RPC: "rpc"
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
  if (!arguments.length) {
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
// Methods: metadata convenience getters and setters.
//-----------------------------------------------------------

p.getConnectionId = function () {
  return this.getMetadata(Message.METADATA.CONNECTION_ID);
};
p.setConnectionId = function (connectionId) {
  this.setMetadata(Message.METADATA.CONNECTION_ID, connectionId);
};

p.getDestination = function () {
  return this.getMetadata(Message.METADATA.DESTINATION);
};
p.setDestination = function (destination) {
  this.setMetadata(Message.METADATA.DESTINATION, destination);
};

p.getFromApplication = function () {
  return this.getMetadata(Message.METADATA.FROM_APPLICATION);
};
p.setFromApplication = function (applicationId) {
  this.setMetadata(Message.METADATA.FROM_APPLICATION, applicationId);
};

p.getId = function () {
  return this.getMetadata(Message.METADATA.IDENTIFIER);
};
p.setId = function (id) {
  this.setMetadata(Message.METADATA.IDENTIFIER, id);
};

p.getOrigin = function () {
  return this.getMetadata(Message.METADATA.ORIGIN);
};
p.setOrigin = function (origin) {
  this.setMetadata(Message.METADATA.ORIGIN, origin);
};

p.getToApplication = function () {
  return this.getMetadata(Message.METADATA.TO_APPLICATION);
};
p.setToApplication = function (applicationId) {
  this.setMetadata(Message.METADATA.TO_APPLICATION, applicationId);
};

p.getType = function () {
  return this.getMetadata(Message.METADATA.TYPE);
};
p.setType = function (type) {
  this.setMetadata(Message.METADATA.TYPE, type);
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
  if (!this.getToApplication()) {
    return false;
  }
  if (!this.getFromApplication()) {
    return false;
  }
  if (!this.getData()) {
    return false;
  }

  var origin = this.getOrigin();
  if (!origin) {
    return false;
  }
  var validOrigin = Object.keys(Message.ORIGINS).some(function (key, index, array) {
    return (Message.ORIGINS[key] === origin);
  });
  if (!validOrigin) {
    return false;
  }
  var destination = this.getDestination();
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
      if(!this.getConnectionId()) {
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
