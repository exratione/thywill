/**
 * The bootstrap framework code for thywill.js, to run on a browser.
 * 
 * Comments show which functions are intended to be defined by applications or by components.
 * 
 */

var thywill = {};

thywill.loader = {
	js: {
		onError: function(jqXHR, textStatus, errorThrown) {
			
		},
		fn: function (url, dataType, success) {
		  var self = this;
			$.ajax({
				url: url,
				type: "GET",
				dataType: dataType,
				error: self.onError,
				success: success
			});
		}
	}
};

thywill.serverInterface = {
    
  // Set to true by the clientInterface component when connected
  connected: false,     
  
  // will be set by the clientInterface component when connected
  clientId: null,
  
  // For application client objects to make themselves known and listen for traffic
  listeningApplications: {},
  registerApplication: function(applicationId, application) {
    this.listeningApplications[applicationId] = application;
  },
  
  // ------------------------------------------------
  // functions to be defined by the clientInterface
  // ------------------------------------------------
  
  send: function(message) {},         
  
  // ------------------------------------------------
  // functions called by the clientInterface
  // ------------------------------------------------
  
	messageReceived: function(message) {
	  if( message && message.applicationId && this.listeningApplications[message.applicationId] ) {
	    this.listeningApplications[message.applicationId].messageReceived(message);
	  }
	},	
	confirmationReceived: function(confirmation) {
    if( confirmation && confirmation.applicationId && this.listeningApplications[confirmation.applicationId] ) {
      this.listeningApplications[confirmation.applicationId].confirmationReceived(message);
    }
	}, 
	messageError: function(error) {
    if( error && error.applicationId && this.listeningApplications[error.applicationId] ) {
      this.listeningApplications[error.applicationId].messageError(error);
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