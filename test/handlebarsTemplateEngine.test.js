/**
 * @fileOverview
 * Vows tests for the HandlebarsTemplateEngine component.
 */

var assert = require("assert");
var tools = require("./tools");

tools.config.templateEngine = {
  implementation: {
    type: "core",
    name: "handlebarsTemplateEngine"
  },
  templateCacheLength: 100
};

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuite("templateEngine/handlebarsTemplateEngine", tools.config);

suite.addBatch({
  "handlebarsTemplateEngine#render": {
    topic: function () {
      template = "<div>{{name}}</div>";
      return tools.thywill.templateEngine.render(template, {
        name: "value"
      });
    },
    "template renders correctly": function (rendered) {
      assert.equal(rendered, "<div>value</div>");
    }
  }
});

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
