
//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * The superclass for resource types such as Javascript and CSS files, or inline Javascript and CSS.
 */
function Resource(type, path, data) {
  this.type = null;
  this.path = null;
  this.data = null;
};
var p = Resource.prototype;

//-----------------------------------------------------------
// "Static" values
//-----------------------------------------------------------

Resource.TYPE_JAVASCRIPT = "application/javascript";
Resource.TYPE_CSS = "text/css";
Resource.TYPE_HTML = "text/html";

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Resource;
