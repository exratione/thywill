/**
 * The bootstrap framework code for thywill.js, to run on a browser.
 * 
 * Comments show which functions are intended to be defined by applications or by components.
 * 
 */

var thywill = {};

thywill.serverInterface = {
    
  // Set to true by the clientInterface component when connected
  connected: false,     
  
  // For application client objects to make themselves known and listen for traffic
  listeningApplications: {},
  registerApplication: function(applicationId, application) {
    this.listeningApplications[applicationId] = application;
  },
  
  // ------------------------------------------------
  // functions to be defined by the clientInterface
  // ------------------------------------------------
  
  send: function(message) {},      
  
  // The persistent server-assigned client ID getter and setter methods.
  setClientId: function(clientId) {},
  getClientId: function() {},
  
  // ------------------------------------------------
  // functions called by the clientInterface
  // ------------------------------------------------
  
  /*
   * A message has arrived from the server. This function routes it to a specific application. 
   * 
   * message - { data: data, applicationId: applicationId }
   */
	messageReceived: function(message) {
	  if( message && message.applicationId && this.listeningApplications[message.applicationId] ) {
	    var fn = this.listeningApplications[message.applicationId].messageReceived(message);
      if( typeof fn == "function" ) {
        fn(error);
      }
	  }
	},	
	
	/*
	 * Confirmation of a sent message.
	 */
	confirmationReceived: function(confirmation) {
    if( confirmation && confirmation.applicationId && this.listeningApplications[confirmation.applicationId] ) {
      var fn = this.listeningApplications[confirmation.applicationId].confirmationReceived(message);
      if( typeof fn == "function" ) {
        fn(error);
      }
    }
	}, 
	
	/*
	 * An error has occurred in sending a message to the server.
	 */
	messageError: function(error) {
    if( error && error.applicationId && this.listeningApplications[error.applicationId] ) {
      var fn = this.listeningApplications[error.applicationId].messageError;
      if( typeof fn == "function" ) {
        fn(error);
      }
    }
	},
	
	/*
	 * The connection to the server is lost for whatever reason - typically network issues.
	 * All applications are notified.
	 */
	disconnected: function() {
	  this.connected = false;
	  for( var i = 0, l = this.listeningApplications.length; i < l; i++ ) {
	    if( typeof this.listeningApplications[i].disconnected == "function" ) {
	      this.listeningApplications[i].disconnected();
	    }
	  }
	},
	
	/*
	 * A lost connection is reestablished. All applictions are notified.
	 */
  reconnected: function() {
    this.connected = true;
    for( var i = 0, l = this.listeningApplications.length; i < l; i++ ) {
      if( typeof this.listeningApplications[i].reconnected == "function" ) {
        this.listeningApplications[i].reconnected();
      }
    }
  }
};

thywill.bootstrap = {
	complete: false, 
	checkCompletion: function() {
		if( thywill.serverInterface.connected ) {
		  this.complete = true;
			for( var i = 0, l = this.listeners.length; i < l; i++ ) {
			  this.listeners[i].call(this);
			}
		} else {
		  setTimeout("thywill.bootstrap.checkCompletion()", 50);
		}
	},
	listeners: []
};

thywill.callOnReady = function(callback) {
  this.bootstrap.listeners.push(callback);
};