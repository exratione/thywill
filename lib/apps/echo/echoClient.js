
var echo = {};

echo.setupInput = function() {
  jQuery("body").append(
   '<div id="sender">' +
     '<textarea></textarea>' +
     '<button>Send</button>' +
   '</div>'
  );
  jQuery("#sender button").click(function() {
   var message = $("#sender textarea").val();
   if( message ) {
     thywill.serverInterface.send(message);
     $("#sender textarea").val("");
   }
  });
};

echo.setupOutput = function() {
  jQuery("body").append('<div id="poc-output" style="margin-top: 10px; width: 500px; height: 200px; overflow-y: scroll; border: 1px solid #cccccc;"></div>');
};

thywill.callOnReady(function() {
  echo.setupInput();
  echo.setupOutput();
});