const zlib = require('zlib');
require('../utils/helpers');
const config = require("../config.json");
const errorLogger = require("../utils/error_logger");
const redirectPath = config.REDIRECT_URL;
const bodyContent = `<script type="text/javascript">window.location="${redirectPath}"</script>`;

const LOG_TAG = "BSL_ERH";
const ALARM_LOG_TAG = config.ALARM_LOG_TAG;


/**
 * Error response handler
 * This method should only be triggered if response status code is >=400 && <=500.
 * This method ads inline javascript that redirects the page to about-blank.
 * 
 * @param  {Object}   response      response object as present in event of lambda function.
 * @param  {String}   requestOrigin Origin of the request.
 * @param  {String}   requestPath   Path of the resource requested.
 * @return {Object}   modified response object. Do not change the refrence.
 */

module.exports = (response, requestOrigin, requestPath) => {

  response.headers = response.headers || {};
  response.headers['content-type'] = [{key:'Content-Type', value: 'text/html; charset=utf-8'}];
  response.body = bodyContent;

  try {
    const buffer = zlib.gzipSync(bodyContent);
    const base64EncodedBody = buffer.toString('base64');
    response.bodyEncoding = 'base64';
    response.headers['content-encoding'] = [{key:'Content-Encoding', value: 'gzip'}];
    response.body = base64EncodedBody;
  } catch(error) {
    errorLogger(LOG_TAG, "could not gzip response.", error);
  }

  // Return the response.
  return response;
};