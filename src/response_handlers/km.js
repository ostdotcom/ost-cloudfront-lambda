const zlib = require('zlib');
const helpers = require('../utils/helpers');
const config = require("../config.json");
const errorLogger = require("../utils/error_logger");

const LOG_TAG = "BSL_KM";
const ALARM_LOG_TAG = config.ALARM_LOG_TAG;

/**
 * Key Manager Response Handler
 * Adds Content Security Policy Headers to the response and triggers callback. 
 * The Caller must ensure this request is serving km-[mappy] resource.
 * 
 * @param  {Object}   response      response object as present in event of lambda function.
 * @param  {String}   requestOrigin Origin of the request.
 * @param  {String}   requestPath   Path of the resource requested.
 * @return {Object}   modified response object. Do not change the refrence.
 */
module.exports = (response, requestOrigin, requestPath ) => {

  // Prepare response headers.
  response.headers = response.headers || {};

  // Add CSP (Content Security Policy) Header Parts.
  const cspParts = helpers.getDefaultCSPParts();

  // Determine the path to JS file.
  let jsFilePath = requestPath.replace("/index.html", "/ost-sdk-key-manager-script.js");
  let jsOrigin = String( config.JS_ORIGIN );
  // Remove right side back-slash
  jsOrigin   = jsOrigin.trimRight("/");

  // Remove left side back-slash
  jsFilePath = jsFilePath.trimLeft("/");

  // Join origin and path.
  jsFilePath = jsOrigin + "/" + jsFilePath;

  // Set the script-src header.
  helpers.addCSPPart(`script-src ${jsFilePath}`, cspParts);

  // Set Content Security Policy Headers.
  const cspValue = cspParts.join("; ");
  response.headers['content-security-policy'] = [{
    key: "Content-Security-Policy",
    value: cspValue
  }];
  console.log(LOG_TAG, "Content-Security-Policy:", cspValue);

  return response;
};