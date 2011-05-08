
//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function Client(id) {
  if( id ) {
    this.id = id;
  } else {
    // UUID generator from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    this.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }
}
var p = Client.prototype;

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Client;