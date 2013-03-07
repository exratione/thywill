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
    clientPath: "/display/js/modernizr.min.js",
    encoding: encoding,
    minified: true,
    type: Resource.TYPES.JAVASCRIPT,
    weight: -30
  },
  // Add jQuery as a resource, setting it a lower weight than the default
  // Thwyill code - having it come first is fairly necessary if you want
  // things to work rather than explode.
  "../../../thirdParty/jquery/jquery.1.7.2.min.js": {
    clientPath: "/display/js/jquery.min.js",
    encoding: encoding,
    minified: true,
    type: Resource.TYPES.JAVASCRIPT,
    weight: -20
  },
  // Add the plugins.js code from HTML5 Boilerplate.
  "../../../thirdParty/html5boilerplate/plugins.js": {
    clientPath: "/display/js/plugins.js",
    encoding: encoding,
    minified: false,
    type: Resource.TYPES.JAVASCRIPT,
    weight: -10
  },
  // Add Handlebars.js.
  "../../../thirdParty/handlebars.js/handlebars.1.0.0.rc.1.js": {
    clientPath: "/display/js/handlebars.js",
    encoding: encoding,
    minified: false,
    type: Resource.TYPES.JAVASCRIPT,
    weight: 10
  },
  // Add HTML5 Boilerplate CSS.
  "../../../thirdParty/html5boilerplate/html5boilerplate.css": {
    clientPath: "/display/css/html5boilerplate.css",
    encoding: encoding,
    minified: false,
    type: Resource.TYPES.CSS,
    weight: 0
  },
  // Add the Display client CSS.
  "../client/css/displayClient.css": {
    clientPath: "/display/css/client.css",
    encoding: encoding,
    minified: false,
    type: Resource.TYPES.CSS,
    weight: 10
  },
  // Add the Display client UI templates. Note that these won't be loaded over
  // HTTP, but rather included into the application main page.
  "../client/template/ui.tpl": {
    clientPath: "/display/tpl/ui.tpl",
    encoding: encoding,
    id: "display-template-ui",
    type: Resource.TYPES.TEMPLATE,
    weight: 0
  },
  "../client/template/text.tpl": {
    clientPath: "/display/tpl/text.tpl",
    encoding: encoding,
    id: "display-template-text",
    type: Resource.TYPES.TEMPLATE,
    weight: 0
  },
  "../client/template/connection.tpl": {
    clientPath: "/display/tpl/connection.tpl",
    encoding: encoding,
    id: "display-template-connection",
    type: Resource.TYPES.TEMPLATE,
    weight: 0
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
