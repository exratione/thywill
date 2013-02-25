/**
 * @fileOverview
 * Batches for testing the EjsTemplateEngine class.
 */

var assert = require("assert");
var Thywill = require("thywill");

/**
 * Add general tests for the EjsTemplateEngine to the suite.
 */
exports.general = function (suite) {
  suite.addBatch({
    "ejsTemplateEngine#render": {
      topic: function () {
        var template = "<div><%= name %></div>";
        return suite.thywillInstances[0].templateEngine.render(template, {
          name: "value"
        });
      },
      "template renders correctly": function (rendered) {
        assert.equal(rendered, "<div>value</div>");
      }
    }
  });
};
