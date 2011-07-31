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
  // Set to true when the clientInterface component is connected
  connected: false,                  
  // For application client objects to make themselves known and listen for traffic
  listeningApplications: {},
  registerApplication: function(id, application) {
    this.listeningApplications[id] = application;
  },
  
  // functions to be defined by the clientInterface
  send: function(message) {},         
  
  // functions called by the clientInterface
	messageReceived: function(message) {
	  if( message.id && this.listeningApplications[message.id] ) {
	    this.listeningApplications[message.id].messageReceived(message);
	  }
	},	
	confirmationReceived: function(confirmation) {
    if( confirmation.id && this.listeningApplications[confirmation.id] ) {
      this.listeningApplications[confirmation.id].confirmationReceived(message);
    }
	}, 
	messageError: function(error) {
    if( error.id && this.listeningApplications[error.id] ) {
      this.listeningApplications[error.id].messageError(error);
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
  this.bootstrap.listeners.push[callback];
};

jQuery(document).ready(thywill.bootstrap.checkCompletion());