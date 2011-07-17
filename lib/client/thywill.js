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
			$.ajax({
				url: url,
				type: "GET",
				dataType: dataType,
				error: thywill.loader.js.onError,
				success: success
			});
		}
	}
};

thywill.serverInterface = {
  connected: false,                   // Set to true when the clientInterface component is connected
	onReceipt: function(message) {},		// Set by clientInterface component: callback when a message is received
	send: function(message) {},         // Set by clientInterface component: send a message
	onSendConfirm: function(confirmation) {}, // Set by clientInterface component: callback confirmation that a message was sent
	onError: function(error) {}			// Set by clientInterface component: callback on an error in the connection
};

thywill.bootstrap = {
	complete: false, 
	checkCompletion: function() {
		if( thywill.serverInterface.connected ) {
			thywill.bootstrap.complete = true;
			for( var i = 0, l = thywill.bootstrap.listeners.length; i < l; i++ ) {
			  thywill.bootstrap.listeners[i].call(this);
			}
		} else {
		  setTimeout(thywill.bootstrap.checkCompletion, 100);
		}
	},
	listeners: []
};

thywill.callOnReady = function(callback) {
  thywill.bootstrap.listeners.push[callback];
};

jQuery(document).ready(thywill.bootstrap.checkCompletion());