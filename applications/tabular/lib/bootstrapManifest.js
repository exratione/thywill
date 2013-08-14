/**
 * @fileOverview
 * The bootstrap manifest is a way of listing files that will be turned into
 * bootstrap resources and presented to a client immediately on connection.
 * The exported manifest must be passed to this function:
 *
 * Application#storeBootstrapResourcesFromManifest
 *
 * This should be done during the invocation of:
 *
 * Application#_defineBootstrapResources
 *
 * Bootstrap resources can be otherwise be created and stored through
 * ClientInterface, ResourceManager, and Application class methods. This is
 * appropriate for Resources that must be constructed or templated.
 */

var path = require('path');
var Thywill = require('thywill');
var Resource = Thywill.getBaseClass('Resource');

var manifest = {
  // Add the template for the application main page.
  '../client/template/thywill.html': {
    clientPath: '/tabular/'
  },
  // Add Modernizr, which has to come first in the Javascript.
  '../../../thirdParty/modernizr/modernizr.2.6.1.min.js': {
    clientPath: '/tabular/js/modernizr.min.js',
    weight: -50
  },
  // Add jQuery as a resource, setting it a lower weight than the default
  // Thwyill code - having it come first is fairly necessary if you want
  // things to work rather than explode.
  '../../../thirdParty/jquery/jquery.1.9.1.min.js': {
    clientPath: '/tabular/js/jquery.min.js',
    weight: -40
  },
  // Add the plugins.js code from HTML5 Boilerplate.
  '../../../thirdParty/html5boilerplate/plugins.js': {
    clientPath: '/tabular/js/plugins.js',
    weight: -30
  },
  // Add in AngularJS files.
  '../../../thirdParty/angular/angular.1.2.0.rc1.min.js': {
    clientPath: '/tabular/js/angular.min.js',
    weight: -20
  },
  '../../../thirdParty/angular/angular-route.1.2.0.rc1.min.js': {
    clientPath: '/tabular/js/angular-route.min.js',
    weight: -19
  },
  '../../../thirdParty/angular/angular-animate.1.2.0.rc1.min.js': {
    clientPath: '/tabular/js/angular-animate.min.js',
    weight: -18
  },
  // Add in the various client and Angular application Javascript files.
  '../client/js/tabularAngularApp.js': {
    clientPath: '/tabular/js/tabularAngularApp.js',
    weight: 3
  },
  // Add HTML5 Boilerplate CSS.
  '../../../thirdParty/html5boilerplate/html5boilerplate.css': {
    clientPath: '/tabular/css/html5boilerplate.css',
    weight: 0
  },
  // Add the client CSS.
  '../client/css/tabularClient.css': {
    clientPath: '/tabular/css/client.css',
    weight: 10
  }
};

// Convert all the relative paths to absolute paths, and set the encoding
// while we're about it.
var absolutePath, absoluteManifest = {};
var encoding = 'utf8';
for (var originFilePath in manifest) {
  absolutePath = path.resolve(__dirname, originFilePath);
  absoluteManifest[absolutePath] = manifest[originFilePath];
  absoluteManifest[absolutePath].encoding = encoding;
}

//-----------------------------------------------------------
// Exports - Manifest object with absolute paths.
//-----------------------------------------------------------

module.exports = absoluteManifest;
