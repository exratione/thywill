/*global
  DS: false,
  Ember: false,
  Thywill: false
*/
/**
 * @fileOverview
 * Client ApplicationInterface for use with Ember.js, including a DS.Adapter implementation.
 */

(function () {

  // ------------------------------------------
  // Thywill DS.Adapter
  // ------------------------------------------

  /**
   * An Adapter for Ember Data. Used:
   *
   * DS.ThywillAdapter.create({
   *   applicationInterface: instance of Thywill.EmberApplicationInterface
   * });
   *
   * See the Ember Data documentation for details on how this is used.
   * https://github.com/emberjs/data
   */
   DS.ThywillAdapter = DS.Adapter.extend({
    // Must be set as an instance of Thywill.EmberApplicationInterface.
    applicationInterface: undefined,
    // Each request to the backend increments this.
    lastId: 1,
    // The stores associated with specific requests.
    requestStores: {},

    // ------------------------------------------
    // Utility functions.
    // ------------------------------------------

    /**
     * Convenience function for sending to the backend.
     */
    send: function (store, data) {
      // Mark this as an Ember data store message.
      data.dsRequestId = this.lastId++;
      // Type object to a string.
      data.type = this.typeName(data.type);
      // Stash the store away to await the reply.
      this.requestStores[data.dsRequestId] = store;
      // And send.
      this.applicationInterface.send(data);
    },

    /**
     * To be called when data is returned from the server.
     */
    received: function (data) {
      if (!data.dsRequestId) {
        return;
      }
      var store = this.requestStores[data.dsRequestId];
      if (!store) {
        return;
      }
      delete this.requestStores[data.dsRequestId];


      // TODO: Expand data.type string back out to a DS.Model object.


      switch (data.action) {
        case "find":
          store.load(data.type, data.id, data.data);
          break;


// TODO: bunch of implementations based on messaging

      }
    },

    /**
     * Given a type, get its name.
     *
     * @param {DS.Model} type
     *   A DS.Model implementation.
     * @return {string}
     *   The type name.
     */
    typeName: function (type) {
      var parts = type.toString().split(".");
      var name = parts[parts.length - 1];
      return name;
    },

    // ------------------------------------------
    // DS.Adaptor functions.
    // ------------------------------------------

    /**
     * Find an instance of a specific type.
     *
     * @param {Object} store
     *   An Ember Data store.
     * @param {DS.Model} type
     *   A DS.Model implementation.
     * @param {mixed} id
     *   Unique ID for a type instance.
     */
    find: function (store, type, id) {
      this.send(store, {
        action: "find",
        id: id,
        type: type
      });
    }


    // TODO: bunch of implementations based on messaging

  });

  // ------------------------------------------
  // ApplicationInterface Class definition.
  // ------------------------------------------

  /**
   * @class
   * An implementation of Thywill.ApplicationInterface for use with Ember.js. Adds
   * the necessary items to hook the Ember store to the server via sockets.
   *
   * @see Thywill.ApplicationInterface
   */
  Thywill.EmberApplicationInterface = function EmberApplicationInterface (applicationId) {
    Thywill.ApplicationInterface.call(this, applicationId);

    // Set up the Ember application and store.
    this.emberApp = Ember.Application.create();
    this.emberApp.adapter = DS.ThywillAdapter.create({
      applicationInterface: this
    });
    this.emberApp.store = DS.Store.create({
      revision: 11,
      adapter: this.emberApp.adapter
    });

    // Divert the received() function so as to siphon off messages intended
    // for the data store adapter.
    this._received = this.received;
    /**
     * @see Thywill.ApplicationInterface#received
     */
    this.received = function (message) {
      if (message.dsRequestId) {
        this.emberApp.adapter.received(message);
      } else {
        this._received(message);
      }
    };
  };
  Thywill.inherits(Thywill.EmberApplicationInterface, Thywill.ApplicationInterface);
  var p = Thywill.EmberApplicationInterface.prototype;

  // ------------------------------------------
  // Methods
  // ------------------------------------------

})();
