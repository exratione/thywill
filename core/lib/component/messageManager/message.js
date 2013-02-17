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

Message.METADATA = {
  FROM_APPLICATION: "faid",
  // Used to identify messages with their replies or otherwise distinguish
  // between messages where important. Not particularly unique.
  IDENTIFIER: "id",
  // The ID of the destination application.
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

/**
 * Clear a particular metadata value.
 *
 * @param {string} key
 *   A metadata key.
 */
p.clearMetadata = function (key) {
  delete this._[key];
};

//-----------------------------------------------------------
// Methods: metadata convenience getters and setters.
//-----------------------------------------------------------

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
 * @return {boolean}
 *   True if this instance is a valid message.
 */
p.isValid = function () {
  // Is it addressed to and from a specific application?
  if (!this.getToApplication()) {
    return false;
  }
  if (!this.getFromApplication()) {
    return false;
  }
  // Does it have data?
  if (!this.getData()) {
    return false;
  }

  return true;
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Message;
