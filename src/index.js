/**
 * IMPORTANT DOCUMENT LINKS:
 * Lambda Event Structure:
 * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html
 *
 * Lambda Example:
 * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-examples.html#lambda-examples-custom-error-static-body
 *
 * https://aws.amazon.com/blogs/networking-and-content-delivery/adding-http-security-headers-using-lambdaedge-and-amazon-cloudfront/
 */

const config = require("./config.json");
const errorLogger = require("./utils/error_logger");
const redirectToBlank = require("./response_handlers/redirect_to_blank");
const sdkResponseHandler = require("./response_handlers/sdk");
const kmResponseHandler = require("./response_handlers/km");

const LOG_TAG = "BSL_index";
const ALARM_LOG_TAG = config.ALARM_LOG_TAG;
const SDK_S3_HOST = config.SDK_S3_HOST;
const KM_S3_HOST  = config.KM_S3_HOST;

/**
 * Method to determine request origin from the request object.
 * The method assumes the request is https.
 * @param  {[type]} requestInfo event.Records[0].cf.request
 * @return {String}             Determined requested url's origin.
 */
const getRequestHost = ( requestInfo ) => {
  const requestHeaders = requestInfo.headers;
  let requestHosts = null;

  //host in request header is case sensitive. 
  //TODO: loop through keys to compare case ignore host and return the value.
  if ( requestHeaders.host ) {
    requestHosts = requestHeaders.host;
  } else if ( requestHeaders.HOST ) {
    requestHosts = requestHeaders.HOST;
  }

  if ( requestHosts && requestHosts.length ) {
    if ( requestHosts.length > 1 ) {
      console.error(ALARM_LOG_TAG, LOG_TAG, "gro_1", "multiple hosts in request header. hosts = ", JSON.stringify(requestHosts) );
    }
    return requestHosts[0].value;
  }

  return null;
}

/**
 * An entry point function for processing the response.
 * @param  {[type]}   event    [description]
 * @param  {[type]}   context  [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
const responseProcessor = (event, context, callback) => {
    //TODO: remove this log.
    console.log(LOG_TAG, "responseProcessor triggered. processing response.");

    
    const response = event.Records[0].cf.response;
    if ( !response ) {
        console.error(ALARM_LOG_TAG, LOG_TAG, "rp_1",  "response is null");
        throw new Error(LOG_TAG +" :: Could not access response object");
    }

    const requestInfo = event.Records[0].cf.request;
    if ( !requestInfo ) {
      console.error(ALARM_LOG_TAG, LOG_TAG, "rp_2",  "requestInfo is null. Silently ignoring.");
      callback(null, response);
      return;
    }

    const headers = response.headers;
    if ( !headers ) {
        console.error(ALARM_LOG_TAG, LOG_TAG, "rp_3", "could not access headers. Silently ignoring.");
        callback(null, response);
        return;
    }

    // Invalid Url
    if (response.status >= 400 && response.status <= 599) { 
      console.log(LOG_TAG, "c4", "redirecting to blank page as response.status =", response.status);
      redirectToBlank(callback, response);
      return;
    }

    const requestS3Host = getRequestHost( requestInfo );
    if ( !requestS3Host ) {
      //TODO: After ensuring requestS3Host is always present, - use redirectToBlank.
      console.error(ALARM_LOG_TAG, LOG_TAG, "rp_4", "could not determine requestS3Host. Silently ignoring.");
      callback(null, response);
      return;
    }

    const requestPath = requestInfo.uri;
    if ( !requestPath ) {
      requestPath = "/";
    }

    console.log("requestS3Host", requestS3Host, "requestPath", requestPath);

    if ( requestS3Host.startsWith(KM_S3_HOST) ) {
      console.log(LOG_TAG, "rp_5", "Key Manager Request Received for requestS3Host ", requestS3Host);
      kmResponseHandler(callback, response, requestS3Host, requestPath);
      return;
    }

    if ( requestS3Host.startsWith(SDK_S3_HOST) ) {
      console.log(LOG_TAG, "rp_6", "Sdk Iframe Request Received for origin ", requestS3Host);
      sdkResponseHandler(callback, response, requestS3Host, requestPath);
      return;
    }

    console.error(ALARM_LOG_TAG, LOG_TAG, "rp_7", "The request is not for SDK or KM. Silently ignoring. requestS3Host = ", requestS3Host , "requestPath = ", requestPath);
    callback(null, response);
}


exports.handler = (event, context, callback) => {
  try {
    responseProcessor(event, context, callback);
  } catch(error) {
    errorLogger(LOG_TAG, "An unexpected js exception occoured. Silently Ignoring.", error);
    const response = event.Records[0].cf.response;
    if ( response ) {
      callback(null, response);
    }
  }
};