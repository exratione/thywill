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
    // Set to true when currently assigned a chat partner.
    this.chatting = false;
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
    this.templates.channelTemplate = Handlebars.compile(jQuery("#{{{channelTemplateId}}}").html());
    jQuery("body").append(this.templates.uiTemplate({
      kickButtonText: "Kick",
      kickText: "Chat partner kicked.",
      kickedText: "You have been kicked!",
      newPartnerButtonText: "New Chat",
      sendButtonText: "Send",
      title: "Thywill: Chat Application",
      waitingText: "Waiting for a chat partner..."
    }));

    // Attach the necessary functionality to the new chat buttons shown after
    // kicking or being kicked. The button aren't disabled at any point, just
    // hidden.
    jQuery("button.new-partner").click(function () {
      jQuery(this).parent().fadeOut("fast", function () {
        jQuery("#waiting").fadeIn("fast", function () {
          // Wait to send, otherwise we can get odd collisions between fade
          // out and fade in of #waiting if the server response is fast enough.
          self.send({
            action: "findPartner"
          });
        });
      });
    });
  };

  /**
   * Disable the chat UI and set it to the waiting for chat partner
   * state.
   *
   * @param {string} closeCircumstance
   *   "kicked" if the close happens because this client was kicked by the
   *   chat parter, or "kick" if this client did the kicking.
   */
  p.closeChatUi = function (closeCircumstance) {
    // Convenience function for showing the right banner message.
    function showMessage () {
      if (closeCircumstance === "kick") {
        jQuery("#kick").fadeIn("fast");
      } else if (closeCircumstance === "kicked") {
        jQuery("#kicked").fadeIn("fast");
      } else {
        jQuery("#waiting").fadeIn("fast");
      }
    }

    this.chatting = false;
    // Turn off the buttons.
    jQuery(".send-button").off("click");
    // Set the chat display back to the waiting state.
    jQuery("#chat-wrapper").removeClass("enabled");
    jQuery("textarea").val("").prop("disabled", true);
    var messages = jQuery(".chat-message");
    if (messages.length) {
      // The callback is only called if there actually are elements here, so
      // we can't just use it all the time.
      messages.fadeOut("fast", function () {
        messages.remove();
        showMessage();
      });
    } else {
      showMessage();
    }
    // Remove display of chat channel/partner.
    jQuery("#channel *").fadeOut("fast", function () {
      jQuery("#channel *").remove();
    });
  };

  /**
   * Enable the chat UI for a new chat partner.
   *
   * @param {string} channelId
   *   The channel for this chat.
   */
  p.openChatUi = function (channelId) {
    var self = this;
    this.chatting = true;

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
    jQuery(".kick-button").on("click", function () {
      // Shut off the UI, notify the server and the chat partner.
      self.closeChatUi("kick");
      self.send({
        action: "kick"
      });
    });

    // Remove the notices, enable the chat window.
    jQuery(".notice").fadeOut("fast");
    // Enabled versions for the UI.
    jQuery("#chat-wrapper").addClass("enabled");
    // Other odds and ends.
    jQuery("textarea").prop("disabled", false);

    // Add the display of channel/chat partner.
    // Render the message HTML.
    var rendered = this.templates.channelTemplate({
      channelId: channelId
    });
    // Convert to DOM. The filter("*") gets rid of newline text nodes, which
    // cause jQuery issues.
    rendered = jQuery.parseHTML(rendered);
    jQuery(rendered).filter("*").hide().appendTo("#channel").fadeIn("fast");
  };

  /**
   * Display a newly arrived chat message.
   *
   * @param {string} messageText
   *   The text of the message.
   */
  p.displayChatMessage = function (messageText) {
    // It's possible for a just-rightly timed message to arrive in the lag time
    // between a user getting kicked and the system noticing that.
    if (!this.chatting) {
      return;
    }

    // Set scroll top, or else the new message might not push down content
    // correctly.
    jQuery("#chat-output").scrollTop(0);
    // Render the message HTML.
    var rendered = this.templates.messageTemplate({
      data: messageText
    });
    // Convert to DOM. The filter("*") gets rid of newline text nodes, which
    // cause jQuery issues.
    rendered = jQuery.parseHTML(rendered);
    // Add the message content to the output div, and slide it in.
    jQuery(rendered).filter("*").hide().prependTo("#chat-output").slideDown();
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

    // Start chatting.
    if (data.action === "startChat") {
      this.openChatUi(data.channelId);
    }
    // The other side kicked this client out of the chat.
    else if (data.action === "kicked") {
      this.closeChatUi("kicked");
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
