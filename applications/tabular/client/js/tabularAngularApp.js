/*global
  angular: false,
  document: false,
  Thywill: false
*/
/**
 * @fileOverview
 * A simple Angular application setup. Normally this would be a lot longer,
 * with multiple modules, many routes, and custom setup code.
 */

(function () {
  'use strict';

  // Obtain a reference to the ApplicationInterface.
  var applicationInterface = Thywill.tabularApplication;
  // Create the example application AngularJS module.
  var tabular = angular.module('tabular', []);

  // Use the config function to set up routes, or route singular in this case.
  tabular.config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        controller: 'tabularMainController',
        templateUrl: '/tabular/partial/main.html'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

  // Create the application controller. Only a single controller here to go
  // with the single route.
  tabular.controller('tabularMainController', ['$scope', function ($scope) {

    /**
     * If there is any chance of $scope.$apply() calls overlapping, as a result
     * of close-running inputs from outside AngularJS then use this instead.
     *
     * @param {Function} fn
     *   A function to call, and which will most likely alter $scope values.
     */
    $scope.$applySafely = function(fn) {
      var phase = this.$root.$$phase;
      if (phase === '$apply' || phase === '$digest') {
        if(typeof(fn) === 'function') {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };

    // The various options for the present connection status.
    var statusOptions = {
      connected: {
        state: 'connected',
        message: 'Connected'
      },
      connecting: {
        state: 'connecting',
        message: 'Connecting'
      },
      connectionFailure: {
        state: 'disconnected',
        message: 'Disconnected'
      },
      disconnected: {
        state: 'disconnected',
        message: 'Disconnected'
      }
    };

    $scope.status = statusOptions.connecting;
    $scope.rows = [];
    // Is the UI enabled? This will change the look and feel as well as
    // whether buttons work.
    $scope.uiEnabled = false;
    // Has the user turned on data coming down from the server?
    $scope.dataEnabled = false;

    /**
     * Getter for the class used to signal whether the UI is enabled or not.
     *
     * @return {string}
     *   The class to apply the wrapper div for the UI.
     */
    $scope.getUiEnabledClass = function () {
      if ($scope.uiEnabled) {
        return 'ui-enabled';
      } else {
        return 'ui-disabled';
      }
    };

    /**
     * Getter for the class used to signal whether the start button is active
     * or not.
     *
     * @return {string}
     *   The class to apply the wrapper div for the UI.
     */
    $scope.getStartButtonEnabledClass = function () {
      if ($scope.dataEnabled) {
        return 'disabled';
      } else {
        return 'enabled';
      }
    };

    /**
     * Getter for the class used to signal whether the stop button is active
     * or not.
     *
     * @return {string}
     *   The class to apply the wrapper div for the UI.
     */
    $scope.getStopButtonEnabledClass = function () {
      if ($scope.dataEnabled) {
        return 'enabled';
      } else {
        return 'disabled';
      }
    };

    /**
     * Send a message to the server to tell it to start sending data, but only
     * if the UI is enabled.
     */
    $scope.start = function () {
      if (!$scope.uiEnabled) {
        return;
      }
      applicationInterface.send('start');
      $scope.dataEnabled = true;
    };

    /**
     * Send a message to the server to tell it to stop sending data, but only
     * if the UI is enabled.
     */
    $scope.stop = function () {
      if (!$scope.uiEnabled) {
        return;
      }
      applicationInterface.send('stop');
      $scope.dataEnabled = false;
    };

    /**
     * Utility function to update the status and then ensure that the view is
     * updated.
     *
     * @param {string} status
     *   The new status.
     * @param {string} logMessage
     *   A message to write to the Thywill application log.
     */
    function updateStatus(status, logMessage) {
      applicationInterface.log(logMessage);
      $scope.$apply(function (scope) {
        scope.status = statusOptions[status];
      });
    }

    // -------------------------------------------------------------
    // Set up listeners on the Thywill application interface.
    // -------------------------------------------------------------

    var connected = function () {
      // Enable the UI.
      $scope.uiEnabled = true;
      updateStatus('connected', 'Client connected.');
    };
    var connecting = function () {
      updateStatus('connecting', 'Client attempting to connect.');
    };
    var connectionFailure = function () {
      updateStatus('connectionFailure', 'Client failed to connect.');
    };
    var disconnected = function () {
      // Disable the UI, and note that data is turned off as well.
      $scope.uiEnabled = false;
      $scope.dataEnabled = false;
      updateStatus('disconnected', 'Client disconnected.');
    };
    var received = function (message) {
      $scope.$apply(function (scope) {
        scope.rows.unshift(message.getData());
      });
    };

    applicationInterface.on('connected', connected);
    applicationInterface.on('connecting', connecting);
    applicationInterface.on('connectionFailure', connectionFailure);
    applicationInterface.on('disconnected', disconnected);
    applicationInterface.on('received', received);

    // Get rid of all the listeners and turn off the flow of data if the user
    // moves away from this page. This application only has a single page, but
    // it's still possible to pile up multiple listeners by changing the URL
    // fragment so that this controller function is called multiple times.
    $scope.$on('$destroy', function () {
      applicationInterface.send('stop');
      applicationInterface.removeListener('connected', connected);
      applicationInterface.removeListener('connecting', connecting);
      applicationInterface.removeListener('connectionFailure', connectionFailure);
      applicationInterface.removeListener('disconnected', disconnected);
      applicationInterface.removeListener('received', received);
    });
  }]);

})();
