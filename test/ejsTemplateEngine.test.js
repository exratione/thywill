/**
 * @fileOverview
 * Vows tests for the EJSTemplateEngine component.
 */

var assert = require("assert");
var tools = require("./tools");

tools.config.templateEngine = {
  implementation: {
    type: "core",
    name: "ejsTemplateEngine"
  }
};

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuite("templateEngine/ejsTemplateEngine", tools.config);

suite.addBatch({
  "ejsTemplateEngine#render": {
    topic: function () {
      template = "<div><%= name %></div>";
      return tools.thywill.templateEngine.render(template, {
        name: "value"
      });
    },
    "template renders correctly": function (rendered) {
      assert.equal(rendered, "<div>value</div>");
    }
  }
});
tools.finalizeVowsSuite(suite);

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;