const zlib = require('zlib');
const helpers = require('../utils/helpers');
const config = require("../config.json");
const errorLogger = require("../utils/error_logger");
const cspParts = [];

const LOG_TAG = "BSL_SDK";
const ALARM_LOG_TAG = config.ALARM_LOG_TAG;

/**
 * Sdk Iframe Response Handler
 * Adds Content Security Policy Headers to the response and triggers callback. 
 * The Caller must ensure this request is serving sdk-[mappy] resource.
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

  //region - Content-Security-Policy - script-src
    // Determine the path to JS file.
    let jsFilePath = requestPath.replace("/index.html", "/ost-sdk-iframe-script.js");
    jsFilePath = jsFilePath.trimLeft("/");
    jsFilePath = jsFilePath.trimRight("/");

    // Determine the origin of JS file.
    let jsOrigin = String( config.JS_ORIGIN );
    jsOrigin   = jsOrigin.trimRight("/");

    // Join origin and path to make an absolute url.
    jsFilePath = jsOrigin + "/" + jsFilePath;

    // Set the script-src header.
    helpers.addCSPPart(`script-src ${jsFilePath}`, cspParts);
  //endregion

  //region - Content-Security-Policy frame-src
    // Determine the path to KM html file. (same as sdk path).
    let kmFilePath = requestPath;
    kmFilePath = kmFilePath.trimLeft("/");
    kmFilePath = kmFilePath.trimRight("/");

    // Determine the origin of km iframe.
    let sdkDomain = config.SDK_KM_MAIN_DOMAIN;
    sdkDomain = sdkDomain.trimRight("/");
    let kmOrigin  = "https://*." + sdkDomain;

    // Join origin and path to make an absolute url. 
    // Yes, I know, using * does not make in an absolute url,
    // But, I tried my best 
    kmFilePath = kmOrigin + "/" + kmFilePath;

    // Set the frame-src header.
    helpers.addCSPPart(`frame-src ${kmFilePath}`, cspParts);
  //endregion

  //region - Content-Security-Policy connect-src
    let apiOrigin = config.PLATFORM_API_ORIGIN;
    apiOrigin = apiOrigin.trimRight("/");
    //Always add trailing back-slash.
    apiOrigin = apiOrigin + "/";

    // Set the connect-src header.
    helpers.addCSPPart(`connect-src ${apiOrigin}`, cspParts);
  //endregion
  
  

  // Set Content Security Policy Headers.
  const cspValue = cspParts.join("; ");
  response.headers['content-security-policy'] = [{
    key: "Content-Security-Policy",
    value: cspValue
  }];

  console.log(LOG_TAG, "Content-Security-Policy:", cspValue);

  // Return the response.
  return response;
};