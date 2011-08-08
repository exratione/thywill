
//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * A Message object wraps data for delivery either from client to server or from server to client.
 * 
 * data - the body of the message
 * clientId - the ID of the sender or recipient client
 * applicationId - if not null, the message is delivered only to this specific application code
 */
function Message(data, clientId, applicationId) {
  this.data = data;
  this.applicationId = applicationId;
  this.clientId = clientId;
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
 * A valid message has at least values for data and clientId. 
 * A null applicationId implies delivery to all applications, but is still valid.
 */
p.isValid = function() {
  return (this.data && this.clientId);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Message;