const zlib = require('zlib');
require('../utils/helpers');
const config = require("../config.json");
const errorLogger = require("../utils/error_logger");
const redirectPath = config.REDIRECT_URL;
const bodyContent = `<script type="text/javascript">window.location="${redirectPath}"</script>`;

const LOG_TAG = "BSL_RTB";
const ALARM_LOG_TAG = config.ALARM_LOG_TAG;

module.exports = (callback, response, requestOrigin, requestPath) => {

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

  // Invoke the callback.
  callback(null, response);
};