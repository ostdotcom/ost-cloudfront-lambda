# About Edge-Lambda Function

## Useful Links
* [Lambda Event Structure](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html)
* [Example: Using an Origin-Response Trigger to Update the Error Status Code to 200-OK](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-examples.html#lambda-examples-custom-error-static-body)
* [Adding HTTP Security Headers Using Lambda@Edge and Amazon CloudFront](https://aws.amazon.com/blogs/networking-and-content-delivery/adding-http-security-headers-using-lambdaedge-and-amazon-cloudfront/)
* [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
* [Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin)
* [Host](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Host)

## Configuration
Configuration file is located here [./src/config.json](./src/config.json).
```json
{
  "SDK_S3_HOST": "wallet-sdk.stagingpepocoin.com.s3.amazonaws.com",
  "KM_S3_HOST": "wallet-km.stagingpepocoin.com.s3.amazonaws.com",
  "SDK_KM_MAIN_DOMAIN": "stagingpepocoin.com",
  "JS_ORIGIN": "https://stagingpepocoin.com/",
  "PLATFORM_API_ORIGIN": "https://api.stagingost.com/",
  "REDIRECT_URL": "about:blank",
  "ALARM_LOG_TAG": "BSL_UNEXPECTED"
}
```
### Details
* `SDK_S3_HOST` - **AWS S3** host that serves the sdk-iframe html.
* `KM_S3_HOST` - **AWS S3** host that serves the key-manager html.
* `SDK_KM_MAIN_DOMAIN` - Main domain from where html files are served. In this example, it is set to stagingpepocoin.com because the html files are served from:
 + `https://sdk-[MAPPY].stagingpepocoin.com/[version]/index.html` 
 + `https://km-[MAPPY].stagingpepocoin.com/[version]/index.html`
* `JS_ORIGIN` - [Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin) from where Ost Wallet Sdk JS files are served. 
* `PLATFORM_API_ORIGIN` - [Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin) of Ost Platfrom Api.
* `REDIRECT_URL` - If AWS S3 Server returns 4XX or 5XX response, it is important to redirect it.
* `ALARM_LOG_TAG` - This is the log tag that can be used to trigger pager-duty alarms.

## Rules Implemented
### 1. 4XX or 5XX Response
4XX or 5XX Response should always redirect to `about:blank`. 
> **Note:** Other rules are **NOT** applied with this rule.

### 2. Response Headers Set
* [Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
  + `Strict-Transport-Security: max-age=63072000; includeSubdomains; preload` 
* [X-Content-Type-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options)
  + `X-Content-Type-Options: nosniff`
* [X-XSS-Protection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection)
  + `X-XSS-Protection: 1; mode=block`

### 3. Common Content-Security-Policy Rules
* `default-src 'none';`
* `base-uri 'none';`
* `block-all-mixed-content;`


### 4. Key-Manager Specific Content-Security-Policy Rule(s)
#### 4.a. sdk-iframe
If key-manager url is:
+ `https://km-[MAPPY].[SDK_KM_MAIN_DOMAIN]/[VERSION]/index.html`

It is only allowed this script:
+ `JS_ORIGIN/[VERSION]/ost-sdk-key-manager-script.js`

With the above configuration, CSP's script-src is set to:
+ `https://stagingpepocoin.com/[VERSION]/ost-sdk-key-manager-script.js`


### 5. Sdk Specific Content-Security-Policy Rule(s)
#### 5.a. script-src
If sdk-iframe url is:
+ `https://sdk-[MAPPY].[SDK_KM_MAIN_DOMAIN]/[VERSION]/index.html`

It is only allowed this script:
+ `JS_ORIGIN/[VERSION]/ost-sdk-iframe-script.js`

With the above configuration, CSP's script-src is set to:
+ `https://stagingpepocoin.com/[VERSION]/ost-sdk-iframe-script.js`

#### 5.b. frame-src
If sdk-iframe url is:
+ `https://sdk-[MAPPY].[SDK_KM_MAIN_DOMAIN]/[VERSION]/index.html`

It is only allowed this script:
+ `https://*.[SDK_KM_MAIN_DOMAIN]/[VERSION]/index.html`

With the above configuration, CSP's frame-src is set to:
+ `https://*.stagingpepocoin.com/[VERSION]/index.html`

## Tests
The commands below assume you are in root directory (`ost-cloudfront-lambda`) of this repository.
### Test Valid Key-Manager Response
```
node ./tests/valid_km_test.js
```
The response is located here: [./tests/responses/km-valid-response.json](./tests/responses/km-valid-response.json)

### Test Valid SDK Response
```
node ./tests/valid_sdk_test.js
```
The response is located here: [./tests/responses/sdk-valid-response.json](./tests/responses/sdk-valid-response.json)