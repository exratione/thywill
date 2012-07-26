
//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * The superclass for resource types such as Javascript and CSS files, or inline Javascript and CSS.
 */
function Resource(type, weight, path, data) {
  this.type = type;
  this.weight = weight;
  this.path = path;
  this.data = data;
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
