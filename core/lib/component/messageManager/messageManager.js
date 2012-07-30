/**
 * @fileOverview
 * MessageManager class definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for resource managers, used to generate and store resources
 * in Thywill - meaning data to be served to a client.
 */
function MessageManager() {
  MessageManager.super_.call(this);
  this.componentType = "messageManager";
};
util.inherits(MessageManager, Thywill.getBaseClass("Component"));
var p = MessageManager.prototype;

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * Obtain a new Message object.
 * 
 * @param {string} data
 *   The body of the message.
 * @param {string} sessionId
 *   The ID of the client, whether sender or recipient.
 * @param {string} applicationId
 *   If not null, the message is flagged for delivery to this application only.
 * @return {Message}
 *   A Message instance.
 */
p.createMessage = function(data, sessionId, applicationId) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = MessageManager;
