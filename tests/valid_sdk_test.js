const testResponse = require("./responses/sdk-valid-response");
const baseTest = require("./base_test");

const expectedCspParts = {};

const addExpectedCSPParts = (part) => {
  let cleanedPart = String( part ).trimRight(";");
  cleanedPart = cleanedPart.toLowerCase();
  expectedCspParts[ cleanedPart ] = false;
};
addExpectedCSPParts("default-src 'none';");
addExpectedCSPParts("script-src https://stagingpepocoin.com/v-dev-12/ost-sdk-iframe-script.js;");
addExpectedCSPParts("frame-src https://*.stagingpepocoin.com/v-dev-12/index.html;");
addExpectedCSPParts("connect-src https://api.stagingost.com/;");
addExpectedCSPParts("base-uri 'none';");
addExpectedCSPParts("block-all-mixed-content;");


baseTest(testResponse, (idk, response) => {
  if ( !response ) {
    console.error("!!! response is null");
    process.exit(1);
  }

  const responseHeaders = response.headers
  if ( typeof response.headers !== 'object') {
    console.error("!!! Invliad response.headers");
    process.exit(1);
  }

  const contentSecurityPolicyHeaders = responseHeaders["Content-Security-Policy"] || responseHeaders["content-security-policy"];
  if ( typeof contentSecurityPolicyHeaders !== 'object' || !(contentSecurityPolicyHeaders instanceof Array)) {
    console.error("!!! contentSecurityPolicyHeaders is not set");
    process.exit(1);
  }

  if ( contentSecurityPolicyHeaders[0].key !== "Content-Security-Policy" ) {
    console.error('"Content-Security-Policy" key is not set in contentSecurityPolicyHeaders');
    process.exit(1);
  }

  const cspParts = contentSecurityPolicyHeaders[0].value.split(";");
  let len = cspParts.length;
  while(len--) {
    let thisPart = cspParts[ len ];
    thisPart = String( thisPart ).trimRight(";"); 
    thisPart = thisPart.toLowerCase();
    thisPart = thisPart.trimLeft(" ");
    if ( expectedCspParts[ thisPart ] === false) {
      expectedCspParts[ thisPart ] = true;
    }
  }

  let k;
  let hasAllParts = true;
  for( k in expectedCspParts ) {
    if ( !expectedCspParts[k] ) {
      console.error("!!! Missing CSP Part:", k );
      hasAllParts = false;
    }
  }

  if ( hasAllParts ) {
    console.log("All CSP Parts are present!");
  } else {
    console.error("cspParts:\n", JSON.stringify(cspParts) );
    console.error("expectedCspParts:\n", JSON.stringify(expectedCspParts) );
    process.exit(1);
  }


  console.log("Test Completed Successfully!");

});