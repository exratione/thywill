/**
 * The bootstrap framework code for thywill.js, to run on a browser.
 * 
 * Comments show which functions are intended to be defined by the application or by components.
 * 
 * Application: replaced by functions defined in the application Javascript loaded following the bootstrap process.
 *
 * Client Interface: replaced by functions defined by Client Interface Javascript
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

thywill.push = {
	bootstrapComplete: false,
	onReceipt: function(message) {},		// Application: callback when a push message is received
	onError: function(error) {},			// Application: callback on an error in the push connection
	establishConnection: function() {},		// Client Interface: called by the bootstrap process. It must call onEstablishConnectionComplete when done.
	onEstablishConnectionComplete: function () {
		thywill.push.bootstrapComplete = true;
		thywill.bootstrap.checkCompletion();
	}
};

thywill.send = {
	bootstrapComplete: false,
	path: null,
	dataType: null,
	onError: function(error) {},			// Application: callback on an error in sending a message to the server
	onConfirm: function(confirmation) {},	// Application: callback confirmation that a message was sent
	fn: function(message) {
		$.ajax({
			url: thywill.send.path,
			type: "POST",
			data: {
				message: message
			},
			dataType: thywill.send.dataType,
			error: thywill.send.onError,
			success: thywill.send.onConfirm
		});	
	}	
};

thywill.bootstrap = {
	bootstrapComplete: false, 
	checkCompletion: function() {
		if( thywill.push.bootstrapComplete && thywill.send.bootstrapComplete ) {
			thywill.bootstrap.bootstrapComplete = true;
		}
	},
	// Called by inline Javascript once all the bootstrap and application Javascript files are loaded.
	fn: function(config) {
		thywill.config = config;
		thywill.send.path = config.bootstrap_parameters.send_path;
		thywill.send.dataType = config.bootstrap_parameters.send_data_type;
		thywill.send.bootstrapComplete = true;
		// the rest of this has to wait until the document is ready.
		$(document).ready(function() {
			thywill.push.establishConnection();
		});
	}
};

thywill.application = {
	fn: function() {},			// Application: the function that starts up the application at the end of bootstrap and its setup.
	bootstrapTime: 0,
	ready: function() {			// Called by the application when it is done with its setup.
		if( thywill.bootstrap.bootstrapComplete ) {
			thywill.application.fn();
		} else {
			thywill.application.bootstrapTime += 100;
			setTimeout(thywill.application.ready, 100);
		}
	}
};