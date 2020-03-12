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
const basicResponseHandler = require("./response_handlers/basic_response_handler");
const errorResponseHandler = require("./response_handlers/error_response_handler");
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
      /**
       * Ideally, this could should never trigger.
       * If it does, check the cloudfront lambda configuration.
       */
        console.error(ALARM_LOG_TAG, LOG_TAG, "rp_1",  "response is null");
        throw new Error(LOG_TAG +" :: Could not access response object");
    }

    const requestInfo = event.Records[0].cf.request;
    if ( !requestInfo ) {
      /**
       * Ideally, this could should never trigger.
       * If it does, check the cloudfront lambda configuration.
       */
      console.error(ALARM_LOG_TAG, LOG_TAG, "rp_2",  "requestInfo is null. Silently ignoring.");
      callback(null, response);
      return;
    }

    const headers = response.headers;
    if ( !headers ) {
      /**
       * Ideally, this could should never trigger.
       * If it does, check the cloudfront lambda configuration.
       */
        console.error(ALARM_LOG_TAG, LOG_TAG, "rp_3", "could not access headers. Silently ignoring.");
        callback(null, response);
        return;
    }

    const requestS3Host = getRequestHost( requestInfo );
    if ( !requestS3Host ) {
      /**
       * Ideally, this could should never trigger.
       * If it does, check the cloudfront lambda configuration.
       */
      console.error(ALARM_LOG_TAG, LOG_TAG, "rp_4", "could not determine requestS3Host. Silently ignoring.");
      callback(null, response);
      return;
    }

    const requestPath = requestInfo.uri;
    if ( !requestPath ) {
      requestPath = "/";
    }

    console.log(LOG_TAG, "rp_5", "Adding basic headers");
    basicResponseHandler( response, requestS3Host, requestPath );

    // Invalid response.
    if (response.status >= 400 && response.status <= 599) { 
      console.log(LOG_TAG, "rp_6", "redirecting to blank page as response.status =", response.status);
      errorResponseHandler(response, requestS3Host, requestPath);
      /**
       * Do not proceed further. 
       * The kmReponseHandler and sdkResponseHandler will add `content-security-policy`.
       * This header will prevent inline script execution, hence preventing the redirect.
       */
      callback(null, response);
      return ;
    }

    // Key-Manager request.
    if ( requestS3Host.startsWith(KM_S3_HOST) ) {
      console.log(LOG_TAG, "rp_7", "Key Manager Request Received for requestS3Host ", requestS3Host);
      kmResponseHandler(response, requestS3Host, requestPath);
    }

    // Sdk Iframe Request
    if ( requestS3Host.startsWith(SDK_S3_HOST) ) {
      console.log(LOG_TAG, "rp_8", "Sdk Iframe Request Received for requestS3Host ", requestS3Host);
      sdkResponseHandler(response, requestS3Host, requestPath);
    }

    // Finally, give back the response.
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