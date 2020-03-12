const lambdaFunction = require("../src/index");
const lambdaContext = require("./responses/sample_context");
const basicHeaderValidator = (idk, response) => {
  if ( !response ) {
    console.error("!!! response is null");
    process.exit(1);
  }

  const responseHeaders = response.headers
  if ( typeof responseHeaders !== 'object') {
    console.error("!!! Invliad response.headers");
    process.exit(1);
  }

  if ( !responseHeaders["strict-transport-security"] ) {
    console.log("!!! strict-transport-security header is missing");
    process.exit(1);
  }

  if ( !responseHeaders["x-content-type-options"] ) {
    console.log("!!! x-content-type-options header is missing");
    process.exit(1);
  }

  if ( !responseHeaders["x-xss-protection"] ) {
    console.log("!!! x-xss-protection header is missing");
    process.exit(1);
  }

  console.log("All basic headers are present!");

};

module.exports = (reponseJson, callback) => {
  return lambdaFunction.handler(reponseJson, lambdaContext, (...args) => {
    basicHeaderValidator(...args);
    callback(...args);
  });
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