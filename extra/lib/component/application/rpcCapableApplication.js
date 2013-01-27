/**
 * @fileOverview
 * RpcCapableApplication class definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for RPC-capable applications running on Thywill.
 *
 * @param {string} id
 *   An ID uniquely identifying this application.
 *
 * @see ApplicationInterface
 */
function RpcCapableApplication (id) {
  RpcCapableApplication.super_.call(this, id);

  // Convenience reference.
  this.rpcErrors = RpcCapableApplication.RPC_ERRORS;

  // Only references added to this object can be accessed by the client
  // when making remote procedure calls.
  this.rpcContext = {};

  // Hijack the RPC messages to process them here.
  var prototype = this.constructor.prototype;
  if (!prototype._receive) {
    // this.received should be the right overridden function for this
    // instance.
    prototype._receive = this.receive;

    /**
     * @see Application#receive
     */
    prototype.receive = function (message) {
      if (message.getType() === this.thywill.messageManager.types.RPC) {
        this.rpc(message);
      } else {
        this._receive(message);
      }
    };
  }

}
util.inherits(RpcCapableApplication, Thywill.getBaseClass("Application"));
var p = RpcCapableApplication.prototype;

// ------------------------------------------
// "Static"
// ------------------------------------------

RpcCapableApplication.RPC_ERRORS = {
  NO_PERMISSION: "np",
  NO_FUNCTION: "nf"
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * A remote procedure call has arrived. Check permissions, invoke the
 * function if it exists and permissions exist, then return a response.
 *
 * @param {Message} message
 *   The message containing the RPC data.
 */
p.rpc = function (message) {
  var self = this;
  var data = message.getData();
  var replyData = {
    id: data.id,
    cbArgs: []
  };
  var replyMessage = this.thywill.messageManager.createReplyMessage(replyData, message);

  // Does this client connection have permissions for this specified name.
  // Note that bad names will give a no permissions error rather than a no
  // function error - this stops information leaking on what's in the server
  // code structure.
  if (!this.rpcPermissionCheck(data.name, message.getConnectionId())) {
    replyData.cbArgs.push(this.rpcErrors.NO_PERMISSION);
    this.send(replyMessage);
    return;
  }

  // Get the function and return an error if it doesn't exist despite there
  // being permissions to use it.
  var functionData = this.getRpcFunctionAndContext(data.name);
  if (!functionData.fn) {
    replyData.cbArgs.push(this.rpcErrors.NO_FUNCTION);
    this.send(replyMessage);
    return;
  }

  // Invoke the function, and return the results. A different approach taken
  // depending on whether or not the function has a callback.
  var args = data.args || [];
  if (data.cb) {
    args.push(function () {
      for (var index = 0, length = arguments.length; index < length; index++) {
        replyData.cbArgs.push(arguments[index]);
      }
      self.send(replyMessage);
    });
    functionData.fn.apply(functionData.context, args);
  } else {
    try {
      var result = functionData.fn.apply(functionData.context, args);
      replyData.cbArgs.push(null);
      replyData.cbArgs.push(result);
    } catch (error) {
      replyData.cbArgs.push(error.message);
    }
    this.send(replyMessage);
  }
};

/**
 * Does this client have permission to access this function?
 *
 * @param {string} name
 *   Function name, possibly in dotted parts.
 * @param {[type]} connectionId [description]
 * @return {[type]}
 */
p.rpcPermissionCheck = function (name, connectionId) {

  // TODO

  return true;
};

/**
 * Return the function and its context as:
 *
 * {
 *   context: object,
 *   fn: function
 * }
 *
 * @param {string} name
 *   Function name, possibly in dotted parts.
 * @return {Object}
 *   The function and its context wrapped in an object.
 */
p.getRpcFunctionAndContext = function (name) {
  var functionData = {
    context: this.rpcContext,
    fn: undefined
  };
  if (typeof name !== "string") {
    return functionData;
  }

  var parts = name.split(".");
  for (var index = 0, length = parts.length; index < length; index++) {
    if (!functionData.context[parts[index]]) {
      break;
    }
    if (index < parts.length - 1) {
      functionData.context = functionData.context[parts[index]];
    } else if (typeof functionData.context[parts[index]] === "function") {
      functionData.fn = functionData.context[parts[index]];
    }
  }
  return functionData;
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = RpcCapableApplication;
