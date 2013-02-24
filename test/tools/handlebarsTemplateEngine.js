/**
 * @fileOverview
 * Batches for testing the HandlebarsTemplateEngine class.
 */

var assert = require("assert");
var Thywill = require("thywill");

/**
 * Add general tests for the HandlebarsTemplateEngine to the suite.
 */
exports.general = function (suite) {
  suite.addBatch({
    "handlebarsTemplateEngine#render": {
      topic: function () {
        var template = "<div>{{name}}</div>";
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
