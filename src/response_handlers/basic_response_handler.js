const config = require("../config.json");
const errorLogger = require("../utils/error_logger");

const LOG_TAG = "BSL_BH";
const ALARM_LOG_TAG = config.ALARM_LOG_TAG;

/**
 * Basic Handler
 * This method adds all the basic security headers. Currently it adds:
 * - strict-transport-security
 * - x-content-type-options
 * - x-xss-protection
 * 
 * @param  {Object}   response      response object as present in event of lambda function.
 * @param  {String}   requestOrigin Origin of the request.
 * @param  {String}   requestPath   Path of the resource requested.
 * @return {Object}   modified response object. Do not change the refrence.
 */

module.exports = (response, requestOrigin, requestPath) => {
  // Set strict-transport-security header.
  response.headers['strict-transport-security'] = [{
    key: 'Strict-Transport-Security', 
    value: 'max-age=63072000; includeSubdomains; preload'
  }];

  // Add nosniff header.
  response.headers['x-content-type-options'] = [{
    key: 'X-Content-Type-Options', 
    value: 'nosniff'
  }];

  // Add xss protection header.
  response.headers['x-xss-protection'] = [{
    key: 'X-XSS-Protection', 
    value: '1; mode=block'
  }];

  return response;
}