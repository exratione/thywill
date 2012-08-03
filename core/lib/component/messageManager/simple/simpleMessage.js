/**
 * @fileOverview
 * SimpleMessage class definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A trivial implementation of the Message class.
 * 
 * @see Message
 */
function SimpleMessage(data, sessionId, origin, destination, fromApplicationId, toApplicationId) {
  SimpleMessage.super_.call(this, data, sessionId, origin, destination, fromApplicationId, toApplicationId);
};
util.inherits(SimpleMessage, Thywill.getBaseClass("Message"));
var p = SimpleMessage.prototype;

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = SimpleMessage;
