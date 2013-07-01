/*global
  Thywill: false
*/
/**
 * @fileOverview
 * Client ApplicationInterface that allows remote procedure calls to invoke
 * server-side functions.
 */

(function () {

  // ---------------------------------------------------
  // RpcCapableApplicationInterface Class definition.
  // ---------------------------------------------------

  /**
   * @class
   * Client ApplicationInterface that allows remote procedure calls to invoke
   * server-side functions.
   *
   * Note that this does not emit events for completed RPC calls, but rather
   * uses the provided callback function.
   *
   * @see Thywill.ApplicationInterface
   */
  Thywill.RpcCapableApplicationInterface = function RpcCapableApplicationInterface (applicationId) {
    Thywill.RpcCapableApplicationInterface.super_.call(this, applicationId);

    // No timeout on RPC calls set by default.
    this.rpcTimeout = 0;
    // Holds the interval ID for the check process associated with timeouts.
    this.rpcTimeoutIntervalId = null;
    // Holds data pending calls and callback function references.
    this.rpcInProgress = {};
    // A counter used to generate identifiers.
    this.rpcCount = 0;

    // Convenience reference.
    this.rpcErrors = Thywill.RpcCapableApplicationInterface.RPC_ERRORS;

  };
  Thywill.inherits(Thywill.RpcCapableApplicationInterface, Thywill.ApplicationInterface);
  var p = Thywill.RpcCapableApplicationInterface.prototype;

  // ------------------------------------------
  // 'Static' properties.
  // ------------------------------------------

  Thywill.RpcCapableApplicationInterface.RPC_ERRORS = {
    DISCONNECTED: 'dc',
    NO_FUNCTION: 'nf',
    NO_PERMISSION: 'np',
    TIMED_OUT: 'to'
  };

  // ------------------------------------------
  // Methods: initialization
  // ------------------------------------------

  /**
   * Override the listening behavior to strip out RPC response messages.
   *
   * @see Thywill.ApplicationInterface#_listenForReceived
   */
  p._listenForReceived = function () {
    var self = this;
    // Message received from the server.
    Thywill.on('received', function (applicationId, message) {
      if (applicationId !== self.applicationId) {
        return;
      }

      if (message.getType() === Thywill.Message.TYPES.RPC) {
        self.rpcResponse(message.getData());
      } else {
        self.received(message);
        self.emit('received', message);
      }
    });
  };

  // ------------------------------------------
  // Methods.
  // ------------------------------------------

  /**
   * Invoke a server function as a remote procedure call. A client must have
   * permission to invoke the function or a permissions error will be returned.
   *
   * Data has the format:
   *
   * {
   *   // The name of the function to invoke. This can be a dotted path, and is
   *   // checked in the scope of 'this' in the server Application instance.
   *   // e.g. 'my.function' would be called server-side as this.my.function()
   *   // in the Application instance.
   *   name: string
   *   // True if the servr function has a callback.
   *   hasCallback: boolean
   *   // Arguments to pass to the server function.
   *   args: object
   * }
   *
   * @param {object} data
   *   The data describing the function call and its arguments.
   * @param {function} [callback]
   *   Of the form function (error, ...) for server functions with a callback,
   *   where the returned values will be the same as those provided to the
   *   server-side callback function. For server functions without callbacks,
   *   this is of the form function (error, returnValue).
   */
  p.rpc = function (data, callback) {
    // If not connected, then immediately respond with a suitable error.
    if (!Thywill.isConnected) {
      callback(this.rpcErrors.DISCONNECTED);
      return;
    }

    // Increment the count, create an identifier.
    this.rpcCount = this.rpcCount + 1;
    var rpcId = this.rpcCount,
        rpcKey = this.getRpcInProgressKey(rpcId);

    // If there's a callback, then create a local record that will be used to
    // link to the response.
    if (typeof callback === 'function') {
      this.rpcInProgress[rpcKey] = {
        callback: callback,
        name: data.name
      };

      // Are we timing out the callback?
      if (this.rpcTimeout) {
        this.rpcInProgress[rpcKey].timedOutAfter = Date.now() + this.rpcTimeout;
      }
    }

    // Assemble the data and send to the server.
    var sendData = {
      id: rpcId,
      name: data.name,
      cb: data.hasCallback,
      args: data.args
    };
    var message = new Thywill.Message(sendData);
    message.setType(Thywill.Message.TYPES.RPC);
    this.send(message);
  };

  /**
   * Invoked when a response to an RPC arrives.
   *
   * @param  {Object} data
   *   Response data for an RPC.
   */
  p.rpcResponse = function (data) {
    var rpcKey = this.getRpcInProgressKey(data.id);
    if (this.rpcInProgress[rpcKey] && typeof this.rpcInProgress[rpcKey].callback === 'function') {
      var callback = this.rpcInProgress[rpcKey].callback;
      delete this.rpcInProgress[rpcKey];
      callback.apply(null, data.cbArgs || []);
    }
  };

  /**
   * Get a string key from a numeric count.
   *
   * @param {number} count
   * @return {string}
   */
  p.getRpcInProgressKey = function (count) {
    return 'rpc' + count;
  };

  /**
   * Set a timeout for future RPCs sent to the server.
   *
   * @param {number} timeout
   *   Timeout in milliseconds.
   */
  p.setRpcTimeout = function (timeout) {
    var self = this;
    if (this.rpcTimeoutIntervalId) {
      clearInterval(this.rpcTimeoutIntervalId);
    }
    this.rpcTimeout = timeout;
    if (this.rpcTimeout) {
      setInterval(function () {
        self._timeoutRpcInProgress();
      }, this.rpcTimeout);
    }
  };

  /**
   * Run through pending RPCs and terminate those that have timed out.
   */
  p._timeoutRpcInProgress = function () {
    var now = Date.now();
    for (var prop in this.rpcInProgress) {
      if (this.rpcInProgress[prop].timedOutAfter && this.rpcInProgress[prop].timedOutAfter < now) {
        var callback = this.rpcInProgress[prop].callback;
        delete this.rpcInProgress[prop];
        callback(this.rpcErrors.TIMED_OUT);
      }
    }
  };

})();
