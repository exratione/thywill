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
 * @param {object} data
 *   The data to be transmitted.
 */
function Message (data, metadata) {
  this.data = data;
  if (metadata && typeof metadata === 'object') {
    this._ = metadata;
  } else {
    this._ = {};
  }
}
var p = Message.prototype;

//-----------------------------------------------------------
// 'Static' parameters
//-----------------------------------------------------------

Message.METADATA = {
  // The type of the message.
  TYPE: 'type'
};

Message.TYPES = {
  NONE: undefined,
  RPC: 'rpc'
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
  if (typeof arguments[0] === 'string') {
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
  if (type === 'object') {
    this._ = arguments[0];
  } else if (type === 'string' && arguments.length > 1) {
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
 * Return a raw object representation of this message. Chiefly useful in
 * testing.
 *
 * @return {object}
 *   A plain object.
 */
p.toObject = function () {
  return {
    data: this.data,
    _: this._
  };
};

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
 * Determine whether this message is valid.
 *
 * @return {boolean}
 *   True if this instance is a valid message.
 */
p.isValid = function () {
  // Always valid. This is intended as a stub that might be expanded by
  // other implementations.
  return true;
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Message;
