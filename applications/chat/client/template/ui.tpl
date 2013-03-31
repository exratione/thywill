<div id="chat-wrapper">
  <div id="title">{{title}}</div>
  <div id="control">
    <textarea></textarea>
    <button class="send-button">{{sendButtonText}}</button>
    <button class="kick-button">{{kickButtonText}}</button>
  </div>
  <div id="chat-output">
    <div id="waiting" class="notice">{{waitingText}}</div>
    <div id="kick" class="notice">
      <span>{{kickText}}</span>
      <button class="new-partner">{{newPartnerButtonText}}</button>
    </div>
    <div id="kicked" class="notice">
      <span>{{kickedText}}</span>
      <button class="new-partner">{{newPartnerButtonText}}</button>
    </div>
  </div>
  <div id="channel"></div>
  <div id="instructions">
    When connected you will be paired to chat with the first other client to
    connect. To chat enter text into the upper box and hit send. The kick
    button will end the chat with the current partner.
  </div>
  <div id="status"></div>
</div>
