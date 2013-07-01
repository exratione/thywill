/*global
  document: false,
  Handlebars: false,
  Thywill: false
*/
/**
 * @fileOverview
 * Client Javascript for the Tabular application.
 */

(function () {
  'use strict';

  // ------------------------------------------
  // Define a Tabular application class.
  // ------------------------------------------

  /**
   * @class
   * An implementation of Thywill.ApplicationInterface for the Tabular
   * application.
   *
   * @see Thywill.ApplicationInterface
   */
  Thywill.TabularApplication = function TabularApplication (applicationId) {
    Thywill.ApplicationInterface.call(this, applicationId);
  };
  Thywill.inherits(Thywill.TabularApplication, Thywill.ApplicationInterface);
  var p = Thywill.TabularApplication.prototype;

  // ------------------------------------------
  // Methods
  // ------------------------------------------

  /**
   * Rudimentary logging.
   *
   * @param {string} logThis
   *   String to log.
   */
  p.log = function (logThis) {
    console.log(logThis);
  };

  // ----------------------------------------------------------
  // Create an application instance.
  // ----------------------------------------------------------

  // Create the application instance. The application ID will be populated
  // by the backend via the Handlebars template engine when this Javascript
  // file is prepared as a resource.
  Thywill.tabularApplication = new Thywill.TabularApplication('{{{applicationId}}}');

})();
