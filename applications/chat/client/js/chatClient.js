/*global
  document: false,
  Handlebars: false,
  paper: false,
  Path: false,
  Tool: false,
  Thywill: false
*/
/**
 * @fileOverview
 * Client Javascript for the Chat application.
 */

(function () {

  // ------------------------------------------
  // Define a Chat application class.
  // ------------------------------------------

  /**
   * @class
   * An implementation of Thywill.ApplicationInterface for the Chat
   * application.
   *
   * @see Thywill.ApplicationInterface
   */
  function ChatApplication (applicationId) {
    Thywill.ApplicationInterface.call(this, applicationId);
    // For storing Handlebars.js templates.
    this.templates = {};
    // Currently assigned chat partner connection ID.
    this.chatPartnerConnectionId = null;
  }
  Thywill.inherits(ChatApplication, Thywill.ApplicationInterface);
  var p = ChatApplication.prototype;

  // ------------------------------------------
  // User Interface Methods
  // ------------------------------------------

  /**
   * Create the application user interface and its event listeners.
   */
  p.uiSetup = function () {
    var self = this;

    // Populate the DOM from the template.
    this.templates.uiTemplate = Handlebars.compile(jQuery("#{{{uiTemplateId}}}").html());
    this.templates.messageTemplate = Handlebars.compile(jQuery("#{{{messageTemplateId}}}").html());
    jQuery("body").append(this.templates.uiTemplate({
      kickButtonText: "Kick",
      sendButtonText: "Send",
      title: "Thywill: Chat Application",
      waitingText: "Waiting for a chat partner..."
    }));
  };

  /**
   * Disable the chat UI and set it to the waiting for chat partner
   * state.
   */
  p.closeChatUi = function () {
    // Remove the current chat partner.
    delete this.chatPartnerConnectionId;
    // Turn off the buttons.
    jQuery("#sender button").off("click");
    // Set the chat display back to the waiting state.
    jQuery("#chat-wrapper").removeClass("enabled");
    jQuery(".chat-message").fadeOut("fast", function () {
      jQuery(".chat-message").remove();
      jQuery("#waiting").fadeIn("fast");
    });
  };

  /**
   * Enable the chat UI for a new chat partner.
   *
   * @param {string} connectionID
   *   The connection ID of the chat partner.
   */
  p.openChatUi = function (connectionId) {
    var self = this;
    this.chatPartnerConnectionId = connectionId;

    // Enable the send button.
    jQuery("#sender .send-button").on("click", function () {
      var textarea = jQuery("#sender textarea");
      var val = textarea.val().trim();
      if (val) {
        // Sending this user-entered data as a message to the server side of the
        // this application.
        self.send({
          action: "message",
          message: val,
          toCid: self.chatPartnerConnectionId
        });
        textarea.val("");
      }
    });

    // Enable the kick button.
    jQuery("#sender .kick-button").addClass("enabled").on("click", function () {
      // Shut off the UI.
      self.closeChatUi();
      // Tell the server to deliver a new chat partner.
      self.send({
        action: "kick"
      });
    });

    // Remove the waiting notice, enable the chat window.
    jQuery("#waiting").fadeOut("fast");

    // Enabled versions for the UI.
    jQuery("#chat-wrapper").addClass("enabled");
  };

  /**
   * Display a newly arrived chat message.
   *
   * @param {string} messageText
   *   The text of the message.
   */
  p.displayChatMessage = function (messageText) {
    // Set scroll top, or else the new message might not push down content
    // correctly.
    jQuery("#chat-output").scrollTop(0);
    // Render the message HTML.
    var rendered = this.templates.messageTemplate({
      data: messageText
    });
    // Add the message content to the output div, and slide it in.
    jQuery(rendered).hide().prependTo("#chat-output").slideDown();
  };

  /**
   * Change the status message.
   */
  p.uiStatus = function (text, className) {
    var status = jQuery("#status");
    var speed = 100;
    status.fadeOut(speed, function () {
      status.html(text)
        .removeClass("connecting connected disconnected")
        .addClass(className)
        .fadeIn(speed);
    });
  };

  // ------------------------------------------
  // Other Methods
  // ------------------------------------------

  /**
   * Rudimentary logging.
   *
   * @param {string} logThis
   *   String to log.
   */
  p.log = function (logThis) {
    console.log(logThis);
  };

  /**
   * @see Thywill.ApplicationInterface#received
   */
  p.received = function (message) {
    var data = message.getData();




console.log(data);




    // The data is of the form:
    // {
    //   action: "startChat",
    //   // The connectionId of the client assigned as chat partner.
    //   cid: string
    // }
    if (data.action === "startChat") {
      this.openChatUi(data.cid);
    }
    // The other side kicked this client out of the chat.
    else if (data.action === "kicked") {
      this.closeChatUi();
    }
    // The other side disconnected.
    else if (data.action === "disconnected") {
      this.closeChatUi();
    }
    // The data is of the form:
    // {
    //   action: "message",
    //   message: string,
    //   // The connectionId of the originating client.
    //   fromCid: string
    // }
    else if (data.action === "message") {
      // In this example, the server side allows anyone to send to anyone else
      // if they know the connection ID. Probably not wise in the real world.
      // Here we only display the message if it's from the current chat
      // partner, and there is a current chat partner.
      if (this.chatPartnerConnectionId && data.fromCid === this.chatPartnerConnectionId) {
        this.displayChatMessage(data.message);
      }
    }
  };

  /**
   * @see Thywill.ApplicationInterface#connecting
   */
  p.connecting = function () {
    this.uiStatus("Connecting...", "connecting");
    this.log("Client attempting to connect.");
  };

  /**
   * @see Thywill.ApplicationInterface#connected
   */
  p.connected = function () {
    this.uiStatus("Connected", "connected");
    this.log("Client connected.");
  };

  /**
   * @see Thywill.ApplicationInterface#connectionFailure
   */
  p.connectionFailure = function () {
    this.uiStatus("Disconnected", "disconnected");
    this.closeChatUi();
    this.log("Client failed to connect.");
  };

  /**
   * @see Thywill.ApplicationInterface#disconnected
   */
  p.disconnected = function () {
    this.uiStatus("Disconnected", "disconnected");
    this.closeChatUi();
    this.log("Client disconnected.");
  };

  // ----------------------------------------------------------
  // Create an application instance and set it up.
  // ----------------------------------------------------------

  // Create the application instance. The application ID will be populated
  // by the backend via the Handlebars template engine when this Javascript
  // file is prepared as a resource.
  var app = new ChatApplication("{{{applicationId}}}");

  // Initial UI setup.
  jQuery(document).ready(function () {
    app.uiSetup();
    Thywill.serverInterface.registerApplication(app);
  });

})();
