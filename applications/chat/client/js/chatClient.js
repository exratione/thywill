/*global
  document: false,
  Handlebars: false,
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

    // TODO: display of chat partner

    // Turn off the buttons.
    jQuery(".send-button").off("click");
    // Set the chat display back to the waiting state.
    jQuery("#chat-wrapper").removeClass("enabled");
    jQuery("textarea").val("");
    jQuery(".chat-message").fadeOut("fast", function () {
      jQuery(".chat-message").remove();
      jQuery("#waiting").fadeIn("fast");
    });
  };

  /**
   * Enable the chat UI for a new chat partner.
   *
   * @param {string} sessionID
   *   The session ID of the chat partner.
   */
  p.openChatUi = function (sessionId) {
    var self = this;

    // TODO: display of chat partner

    // Enable the send button.
    jQuery(".send-button").on("click", function () {
      var textarea = jQuery("textarea");
      var val = textarea.val().trim();
      if (val) {
        // Sending this user-entered data as a message to the server side of the
        // this application.
        self.send({
          action: "message",
          message: val
        });
        textarea.val("");
      }
    });

    // Enable the kick button.
    jQuery(".kick-button").addClass("enabled").on("click", function () {
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
    // Convert to DOM. The trim is needed to stop jQuery complaining.
    rendered = jQuery.parseHTML(rendered.trim());
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
      this.openChatUi(data.sid);
    }
    // The other side kicked this client out of the chat.
    else if (data.action === "kicked") {
      this.closeChatUi();
    }
    // The other side disconnected.
    else if (data.action === "disconnected") {

      // TODO: give a notice.
      //this.closeChatUi();
    }
    // The data is of the form:
    // {
    //   action: "message",
    //   message: string
    // }
    else if (data.action === "message") {
      this.displayChatMessage(data.message);
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
