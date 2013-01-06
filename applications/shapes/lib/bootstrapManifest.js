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
 * ClientInterface, ResourceManager, and Application class methods.
 */

var path = require("path");
var Thywill = require("thywill");

var Resource = Thywill.getBaseClass("Resource");
var encoding = "utf8";

var manifest = {
  // Add Modernizr, which has to come first in the Javascript.
  "../../../thirdParty/modernizr/modernizr.2.6.1.min.js": {
    clientPath: "/shapes/js/modernizr.min.js",
    encoding: encoding,
    minified: true,
    servedBy: Resource.SERVED_BY.EXPRESS,
    type: Resource.TYPES.JAVASCRIPT,
    weight: -30
  },
  // Add jQuery as a resource, setting it a lower weight than the default
  // Thwyill code - having it come first is fairly necessary if you want
  // things to work rather than explode.
  "../../../thirdParty/jquery/jquery.1.7.2.min.js": {
    clientPath: "/shapes/js/jquery.min.js",
    encoding: encoding,
    minified: true,
    servedBy: Resource.SERVED_BY.EXPRESS,
    type: Resource.TYPES.JAVASCRIPT,
    weight: -20
  },
  // Add the plugins.js code from HTML5 Boilerplate.
  "../../../thirdParty/html5boilerplate/plugins.js": {
    clientPath: "/shapes/js/plugins.js",
    encoding: encoding,
    minified: false,
    servedBy: Resource.SERVED_BY.EXPRESS,
    type: Resource.TYPES.JAVASCRIPT,
    weight: -10
  },
  // Add Handlebars.js.
  "../../../thirdParty/handlebars.js/handlebars.1.0.0.rc.1.js": {
    clientPath: "/shapes/js/handlebars.js",
    encoding: encoding,
    minified: true,
    servedBy: Resource.SERVED_BY.EXPRESS,
    type: Resource.TYPES.JAVASCRIPT,
    weight: 20
  },
  // Add Ember.js
  "../../../thirdParty/ember.js/ember.20130105.js": {
    clientPath: "/shapes/js/ember.js",
    encoding: encoding,
    minified: true,
    servedBy: Resource.SERVED_BY.EXPRESS,
    type: Resource.TYPES.JAVASCRIPT,
    weight: 30
  },
  // Add Ember Data.
  "../../../thirdParty/ember.js/ember-data.20130105.js": {
    clientPath: "/shapes/js/ember-data.js",
    encoding: encoding,
    minified: true,
    servedBy: Resource.SERVED_BY.EXPRESS,
    type: Resource.TYPES.JAVASCRIPT,
    weight: 40
  },
  // Add the Thywill EmberApplicationInterface.
  "../../../extra/client/applicationInterface/emberApplicationInterface.js": {
    clientPath: "/shapes/js/emberApplicationInterface.js",
    encoding: encoding,
    minified: false,
    servedBy: Resource.SERVED_BY.EXPRESS,
    type: Resource.TYPES.JAVASCRIPT,
    weight: 50
  },
  // Add HTML5 Boilerplate CSS.
  "../../../thirdParty/html5boilerplate/html5boilerplate.css": {
    clientPath: "/shapes/css/html5boilerplate.css",
    encoding: encoding,
    minified: false,
    servedBy: Resource.SERVED_BY.EXPRESS,
    type: Resource.TYPES.CSS,
    weight: 0
  },
  // Add the Shapes client CSS.
  "../client/css/shapesClient.css": {
    clientPath: "/shapes/css/client.css",
    encoding: encoding,
    minified: false,
    servedBy: Resource.SERVED_BY.EXPRESS,
    type: Resource.TYPES.CSS,
    weight: 10
  }
};

// Convert all the relative paths to absolute paths.
var absolutePath, absoluteManifest = {};
for (var originFilePath in manifest) {
  absolutePath = path.resolve(__dirname, originFilePath);
  absoluteManifest[absolutePath] = manifest[originFilePath];
}

//-----------------------------------------------------------
// Exports - Manifest object with absolute paths.
//-----------------------------------------------------------

module.exports = absoluteManifest;
