/**
 * @fileOverview 
 * Component class definition.
 */

var EventEmitter = require("events").EventEmitter;
var util = require("util");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class 
 * The superclass for the thywill framework component classes.
 */
function Component() {
  Component.super_.call(this);
  this.componentType = "component";
  this.config = null;
  this.ready = false;
  this.readyCallback = null;  
  this.thywill = null;
  
  // Used to make callback code a little more comprehensible, since most
  // callbacks are of the form function (error, results...) where 
  // error == null on success.
  this.NO_ERRORS = null;
};
util.inherits(Component, EventEmitter);
var p = Component.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

/**
 * The configuration template. Not used in this class, as it isn't intended
 * to be instantiated, but subclasses should have a template by which 
 * configuration can be validated.
 */
Component.CONFIG_TEMPLATE = null;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * Announce that the component object is ready for use. This implies that
 * all asynchronous configuration and initialization tasks required for this
 * object to be used are now complete.
 * 
 * @param {string} error 
 *   Any errors generated during setup, or null on success.
 */
p._announceReady = function (error) {
  if (!error) {
    this.ready = true;
  }
  if (this.componentType == "thywill") {
    var eventName = "thywill.ready";
  } else {
    var eventName = "thywill." + this.componentType + ".ready";
  }
  this.emit(eventName, error);
  if (this.readyCallback) {
    this.readyCallback.call(this, error);
  }
};

/**
 * If this class has a configuration template associated with its constructor,
 * then check it against the provided configuration.
 * 
 * @param {Object} config 
 *   The configuration object for this instance.
 */
p._checkConfiguration = function (config) {
  if (config instanceof Object && this.constructor.CONFIG_TEMPLATE instanceof Object) {
    this._checkConfigurationRecursively(config, this.constructor.CONFIG_TEMPLATE);
  }
};

/**
 * Recursively step through the configuration and the matching template. The 
 * template looks like this - but may have multiple levels of objects, just
 * like the configuration.
 * 
 * {
 *  value1: {
 *    _configInfo: {
 *      types: array or one of "object", "array", "boolean", "string", "number", "integer"
 *      required: true or false
 *      allowedValues: array or null
 *    }
 *  },
 *  value2: ...
 * }
 * 
 * @param {Object} configObj
 *   A portion of the configuration object.
 * @param {Object} templateObj
 *   An object describing the desired configuration.
 * @param {string} propertyChain
 *   A string to keep track of which configuration property is being inspected. 
 */
p._checkConfigurationRecursively = function (configObj, templateObj, propertyChain) {
  
  for (property in templateObj) {
    
    if (propertyChain) { 
      var thisPropertyChain = propertyChain + "." + property;
    } else {
      var thisPropertyChain = property;
    }

    var configInfo = templateObj[property]._configInfo;
    var configValue = configObj[property];
    
    // If this is a nested set of further properties then recurse.
    if (configValue instanceof Object) {
      this._checkConfigurationRecursively(configValue, templateObj[property], thisPropertyChain);
    }
    
    // It's possible that there is no configInfo for this level of 
    // configuration; e.g. it's just a holder for sub-values. If this is the
    // case, then skip to the next property.
    if (!configInfo) {
      continue;
    }
    
    // Is this property required and/or missing?
    if (configValue == undefined) {
      if (configInfo.required) {
        this._throwConfigurationError(thisPropertyChain, "required, but missing");
      } else {
        // Permitted not to exist, so continue on to the next property.
        continue;
      }
    }
    
    // Check type.
    if (configInfo.types) {
      if (!(configInfo.types instanceof Array)) {
        configInfo.types = [configInfo.types];
      }
      var found = false;
      var configValueType = this._getType(configValue);
      for (var i = 0, l = configInfo.types.length; i < l; i++) {
        if (configValueType == configInfo.types[i]) {
          found = true;
          break;
        }
      }
      if (!found) {
        this._throwConfigurationError(thisPropertyChain, "invalid type, found " + configValueType + " expecting one of [" + configInfo.types.toString() + "]");
      }
    }
    
    // Check allowed values.
    if (configInfo.allowedValues instanceof Array) {
      var found = false;
      for (var i = 0, l = configInfo.allowedValues.length; i < l; i++) {
        if (configInfo.allowedValues[i] == configValue) {
          found = true;
          break;
        }
      }
      if (!found) {
        this._throwConfigurationError(thisPropertyChain, "invalid value, found " + configValue + " expecting one of [" + configInfo.allowedValues.toString() + "]");
      }
    }
    
  }
};

/**
 * An augmented type detection function.
 * 
 * @param value 
 *   Any value.
 * @return {string} 
 *   One of: "object", "array", "boolean", "string", "number", "integer",
 *   "undefined", "null", "function".
 */
p._getType = function (value) {
  var type = typeof value;
  if (type == "object") {
    if (value instanceof Array) {
      type == "array";
    } else if(value == null) {
      type == "null";
    }
  } else if(type == "number") {
    if (value % 1 == 0) {
      type = "integer";
    }
  } else if(type == "string") {
    if (value.match(/^\d+$/)) {
      type = "integer";
    } else if(value.match(/^\d*\.?\d*$/)) {
      type = "number";
    }
  }
  return type;
};

/**
 * Throw an error based on a configuration issue.
 * 
 * @param {string} propertyChain
 *   A name of the property where the error was found.
 * @param {string} error
 *   The error in question.
 */
p._throwConfigurationError = function (propertyChain, error) {
  throw new Error(
    "Configuration error for constructor " 
    + this.constructor.name
    + " and configuration property " 
    + propertyChain + ": " + error
  );
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * Configure and initialize the component instance.
 * 
 * @param {Thywill} thywill 
 *   The thywill instance, used to obtain component references.
 * @param {Object} config 
 *   An object representation ofconfiguration data.
 * @param {Function} callback 
 *   Of the form function (error) where error == null on success.
 */
p._configure = function (thywill, config, callback) {
  throw new Error("Not implemented.");
};

/**
 * Called when the application will be shutdown: do everything that needs to be
 * done, and call the callback function ONLY WHEN EVERYTHING YOU NEED TO DO 
 * IS COMPLETE.
 * 
 * @param {Function} callback
 */
p._prepareForShutdown = function (callback) {
  throw new Error("Not implemented."); 
};


//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Component;