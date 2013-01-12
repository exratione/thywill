/**
 * @fileOverview
 * Message class definition.
 */

var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A Message instance wraps data for delivery between client and server. It
 * expects values of the form:
 *
 * {
 *   // The body of the message.
 *   data: object
 *   // The ID of the specific client connecton, whether sender or recipient.
 *   connectionId: string
 *   // Whether the message originated from server or client.
 *   origin: Message.ORIGINS.CLIENT || Message.ORIGINS.SERVER
 *   // Whether the message is delivered to server or client.
 *   destination: Message.DESTINATIONS.CLIENT || Message.DESTINATIONS.SERVER
 *   // The ID of the originating application.
 *   fromApplicationId: string
 *   // If not null, the message is flagged for delivery to this application
 *   // only.
 *   toApplicationId: string
 * }
 *
 * @param {Object} params
 *   Message parameters.
 */
function Message (params) {
  this.data = params.data;
  this.connectionId = params.connectionId;
  this.origin = params.origin;
  this.destination = params.destination;
  this.fromApplicationId = params.fromApplicationId;
  this.toApplicationId = params.toApplicationId;
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

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * Return a JSON string representing this object.
 *
 * @return {string}
 *   A JSON string representing this instance.
 */
p.encode = function () {
  try {
    return JSON.stringify(this);
  } catch (e) {
    // TODO log it.
    return null;
  }
};

/**
 * A valid message has at least values for data and connectionId. A null
 * toApplicationId implies delivery to all applications, but is still valid.
 *
 * @return {boolean}
 *   True if this instance is a valid message.
 */
p.isValid = function () {
  // TODO more rigorous check.

  // A message to or from the client.
  if (this.data && this.connectionId && this.fromApplicationId) {
    return true;
  }
  // A message between two server application components.
  else if (this.data && this.origin === Message.ORIGINS.SERVER && this.destination === Message.DESTINATIONS.SERVER && this.fromApplicationId) {
    return true;
  }
  // Otherwise invalid.
  else {
    return false;
  }
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Message;
