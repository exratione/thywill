
//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * Message constructor. Usage:
 * 
 * new Message(encodedMessageString);
 * 
 * or
 * 
 * new Message(data, applicationId);
 */
function Message() {
  this.data = null;
  this.applicationId = null;
  
  if( arguments.length == 1 ) {
    try {
      var decoded = JSON.parse(arguments[0]);
      this.data = decoded.data;
      this.applicationId = decoded.applicationId;
    } catch (e) {
      // TODO log it
    }
  } else if( arguments.length > 1 ) {
    this.data = arguments[0];
    this.applicationId = arguments[1];
  }
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

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Message;