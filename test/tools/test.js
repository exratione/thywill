

var tools = require("./index");
var baseConfig = require("./baseTestThywillConfig");
var Thywill = require("Thywill");

var options = {
  config: baseConfig,
  applications: null,
  useExpress: false,
  useRedis: false
};

var config = tools.setupConfig(options.config, options);
Thywill.launch(config, [], function (error, thywill) {
  console.log(arguments);
});
