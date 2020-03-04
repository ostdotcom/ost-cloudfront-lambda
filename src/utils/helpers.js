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

const addCSPPart = exports.addCSPPart = ( part, cspPartsArray ) => {
  let cleanedPart = String( part ).trimRight(";");
  cleanedPart = cleanedPart.toLowerCase();
  cspPartsArray.push( cleanedPart );
};

const getDefaultCSPParts = exports.getDefaultCSPParts = ()  => {
  const cspParts = [];
  addCSPPart("default-src 'none';" , cspParts);
  addCSPPart("base-uri 'none';", cspParts);
  addCSPPart("block-all-mixed-content;", cspParts);
  return cspParts;
}