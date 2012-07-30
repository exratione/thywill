/**
 * @fileOverview
 * Message class definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A simple Message implementation.
 * 
 * @param {string} data
 *   The body of the message.
 * @param {string} sessionId
 *   The ID of the client, whether sender or recipient.
 * @param {string} applicationId
 *   If not null, the message is flagged for delivery to this application only.
 */
function SimpleMessage(data, sessionId, applicationId) {
  SimpleMessage.super_.call(this, data, sessionId, applicationId);
};
util.inherits(SimpleMessage, Thywill.getBaseClass("Message"));
var p = SimpleMessage.prototype;

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = SimpleMessage;
