/**
 * @fileOverview
 * Message class definition.
 */

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
 * @param {string} applicationId
 *   If not null, the message is flagged for delivery to this application only.
 */
function Message(data, sessionId, applicationId) {
  this.data = data;
  this.applicationId = applicationId;
  this.sessionId = sessionId;
};
var p = Message.prototype;

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
 * applicationId implies delivery to all applications, but is still valid.
 * 
 * @return {boolean}
 *   True if this instance is a valid message.
 */
p.isValid = function () {
  return (this.data && this.sessionId);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Message;