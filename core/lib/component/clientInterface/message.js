
//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * A Message object wraps data for delivery either from client to server or from server to client.
 * 
 * data - the body of the message
 * sessionId - the ID of the sender or recipient client
 * applicationId - if not null, the message is delivered only to this specific application code
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

/*
 * Return a JSON string representing this object.
 */
p.encode = function() {
  try {
    return JSON.stringify(this);
  } catch (e) {
    // TODO log it
    return null;
  }  
};

/*
 * A valid message has at least values for data and sessionId. 
 * A null applicationId implies delivery to all applications, but is still valid.
 */
p.isValid = function() {
  return (this.data && this.sessionId);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Message;