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
 * A Message instance wraps data for delivery between client and server.
 *
 * @param {string} data
 *   The body of the message.
 * @param {string} sessionId
 *   The ID of the client, whether sender or recipient.
 * @param {string} origin
 *   Whether the message originated from server or client.
 * @param {string} destination
 *   Whether the message is delivered to server or client.
 * @param {string} fromApplicationId
 *   The ID of the originating application.
 * @param {string} [toApplicationId]
 *   If not null, the message is flagged for delivery to this application only.
 */
function Message(data, sessionId, origin, destination, fromApplicationId, toApplicationId) {
  this.data = data;
  this.sessionId = sessionId;
  this.origin = origin;
  this.destination = destination;
  this.fromApplicationId = fromApplicationId;
  this.toApplicationId = toApplicationId;
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
 * A valid message has at least values for data and sessionId. A null
 * toApplicationId implies delivery to all applications, but is still valid.
 *
 * @return {boolean}
 *   True if this instance is a valid message.
 */
p.isValid = function () {
  // TODO more rigorous check.
  return (this.data && this.sessionId && this.fromApplicationId);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Message;
