const lambdaFunction = require("../src/index");
const lambdaContext = require("./responses/sample_context");
module.exports = (reponseJson, callback) => {
  return lambdaFunction.handler(reponseJson, lambdaContext, callback);
};


String.prototype.trimRight = function(charlist) {
  if (charlist === undefined)
    charlist = "\s";

  return this.replace(new RegExp("[" + charlist + "]+$"), "");
};

String.prototype.trimLeft = function(charlist) {
  if (charlist === undefined)
    charlist = "\s";

  return this.replace(new RegExp("^[" + charlist + "]+"), "");
};