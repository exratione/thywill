/**
 * @fileOverview
 * The bootstrap manifest is a way of listing files that will be turned into
 * bootstrap Resources and presented to a client immediately on connection.
 * The exported manifest must be passed to this function:
 *
 * Application#storeBootstrapResourcesFromManifest
 *
 * This should be done during the invocation of:
 *
 * Application#_defineBootstrapResources
 *
 * Bootstrap Resources can be otherwise be created and stored through
 * ClientInterface, ResourceManager, and Application class methods. This is
 * appropriate for Resources that must be constructed or templated.
 */

var path = require('path');
var Thywill = require('thywill');
var Resource = Thywill.getBaseClass('Resource');

var manifest = {
  // Add the template for the application main page.
  '../client/template/thywill.html': {
    clientPath: '/echo/'
  },
  // Add Modernizr, which has to come first in the Javascript.
  '../../../thirdParty/modernizr/modernizr.2.6.1.min.js': {
    clientPath: '/echo/js/modernizr.min.js',
    weight: -30
  },
  // Add jQuery as a resource, setting it a lower weight than the default
  // Thwyill code - having it come first is fairly necessary if you want
  // things to work rather than explode.
  '../../../thirdParty/jquery/jquery.1.9.1.min.js': {
    clientPath: '/echo/js/jquery.min.js',
    weight: -20
  },
  // Add the plugins.js code from HTML5 Boilerplate.
  '../../../thirdParty/html5boilerplate/plugins.js': {
    clientPath: '/echo/js/plugins.js',
    weight: -10
  },
  // Add Handlebars.js.
  '../../../thirdParty/handlebars/handlebars.1.0.0.rc.1.js': {
    clientPath: '/echo/js/handlebars.js',
    weight: 10
  },
  // Add HTML5 Boilerplate CSS.
  '../../../thirdParty/html5boilerplate/html5boilerplate.css': {
    clientPath: '/echo/css/html5boilerplate.css',
    weight: 0
  },
  // Add the Echo client CSS.
  '../client/css/echoClient.css': {
    clientPath: '/echo/css/client.css',
    weight: 10
  },
  // Add the Echo client message display template. Note that this won't be
  // loaded over HTTP, but rather included into the application main page.
  '../client/template/message.tpl': {
    clientPath: '/echo/tpl/message.tpl',
    id: 'echo-template-message',
    type: Resource.TYPES.TEMPLATE,
    weight: 0
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
