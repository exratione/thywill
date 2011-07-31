var EventEmitter = require("events").EventEmitter;
var util = require("util");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * The superclass for the thywill framework component classes.
 */
function Component() {
  Component.super_.call(this);
  this.componentType = "component";
  this.config = null;
  this.ready = false;
  this.readyCallback = null;  
  this.thywill = null;
  
};
util.inherits(Component, EventEmitter);
var p = Component.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

/*
 * Used to make callback code a little more comprehensible, since most callbacks are
 * of the form function(error, results...) where error == null on success.
 */
Component.NO_ERRORS = null;

/*
 * The configuration template. Not used in this class, as it isn't intended to be instantiated,
 * but subsclasses should have a template by which configuration can be validated.
 */
Component.CONFIG_TEMPLATE = null;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/*
 * Announce that the component object is ready for use. This implies that
 * all asynchronous configuration and initialization tasks required for this
 * object to be used are now complete.
 * 
 * error - Component.NO_ERRORS on success.
 */
p._announceReady = function(error) {
  if( !error ) {
    this.ready = true;
  }
  if( this.componentType == "thywill" ) {
    var eventName = "thywill.ready";
  } else {
    var eventName = "thywill." + this.componentType + ".ready";
  }
  this.emit(eventName, error);
  if( this.readyCallback ) {
    this.readyCallback.call(this, error);
  }
};

/*
 * If this class has a configuration template associated with its constructor, then check it against
 * the provided configuration.
 * 
 * config - the configuration object for this instance
 */
p._checkConfiguration = function(config) {
  if( config instanceof Object && this.constructor.CONFIG_TEMPLATE instanceof Object ) {
    this._checkConfigurationRecursively(config, this.constructor.CONFIG_TEMPLATE);
  }
};

/*
 * Recursively step through the configuration and the matching template. The template
 * looks like this - but may have multiple levels of objects, just like the configuration.
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
 */
p._checkConfigurationRecursively = function(configObj, templateObj, propertyChain) {
  
  for( property in templateObj ) {
    
    if( propertyChain ) { 
      var thisPropertyChain = propertyChain + "." + property;
    } else {
      var thisPropertyChain = property;
    }

    var configInfo = templateObj[property]._configInfo;
    var configValue = configObj[property];
    
    // if this is a nested set of further properties then recurse
    if( configValue instanceof Object ) {
      this._checkConfiguration(configValue, templateObj[property], thisPropertyChain);
    }
    
    // It's possible that there is no configInfo for this level of configuration; e.g. it's just a holder for sub-values
    // If this is the case, then skip to the next property.
    if( !configInfo ) {
      continue;
    }
    
    // is this property required and/or missing?
    if( configValue == undefined ) {
      if( configInfo.required ) {
        this.throwConfigurationError(thisPropertyChain, "required, but missing");
      } else {
        // permitted not to exist, so continue on to the next property
        continue;
      }
    }
    
    // check type
    if( configInfo.types ) {
      if( !(configInfo.types instanceof Array) ) {
        configInfo.types = [configInfo.types];
      }
      var found = false;
      var configValueType = this._getType(configValue);
      for( var i = 0, l = configInfo.types.length; i < l; i++ ) {
        if( configValueType == configInfo.types[i] ) {
          found = true;
          break;
        }
      }
      if( !found ) {
        this._throwConfigurationError(thisPropertyChain, "invalid type, found " + configValueType + " expecting one of [" + configInfo.types.toString() + "]");
      }
    }
    
    // check allowed values
    if( configInfo.allowedValues instanceof Array ) {
      var found = false;
      for( var i = 0, l = configInfo.allowedValues.length; i < l; i++ ) {
        if( configInfo.allowedValues[i] == configValue ) {
          found = true;
          break;
        }
      }
      if( !found ) {
        this._throwConfigurationError(thisPropertyChain, "invalid value, found " + configValue + " expecting one of [" + configInfo.allowedValues.toString() + "]");
      }
    }
    
  }
};

/*
 * An augmented type detection function.
 * 
 * Returns one of: "object", "array", "boolean", "string", "number", "integer", "undefined", "null", "function"
 */
p._getType = function(value) {
  var type = typeof value;
  if( type == "object" ) {
    if( value instanceof Array ) {
      type == "array";
    } else if( value == null ) {
      type == "null";
    }
  } else if( type == "number" ) {
    if( value % 1 == 0 ) {
      type = "integer";
    }
  } else if( type == "string" ) {
    if( value.match(/^\d+$/) ) {
      type = "integer";
    } else if( value.match(/^\d*\.?\d*$/) ) {
      type = "number";
    }
  }
  return type;
};

p._throwConfigurationError = function(propertyChain, error) {
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

/*
 * Configure and initialize.
 * 
 * thywill - the thywill instance, used to obtain component references
 * config - JSON configuration data.
 * callback - function(error) where error == Component.NO_ERRORS on success.
 */
p._configure = function(thywill, config, callback) {
  throw new Error("Not implemented.");
};

/*
 * The application will be shutdown: do everything that needs to be done,
 * and call the callback function ONLY WHEN EVERYTHING YOU NEED TO DO IS COMPLETE.
 */
p._prepareForShutdown = function(callback) {
  throw new Error("Not implemented."); 
};


//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Component;