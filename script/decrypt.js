const { json } = require("body-parser");
var eccrypto = require("eccrypto");

var privateKeyA = eccrypto.generatePrivate();
var publicKeyA = eccrypto.getPublic(privateKeyA);
var privateKeyB = eccrypto.generatePrivate();
var publicKeyB = eccrypto.getPublic(privateKeyB);

var CumtumEnc = {};

console.log(privateKeyA);

// Encrypting the message for B.
CumtumEnc.eccB = async function(MSG){
  console.log("in ECC-B")
  return await eccrypto.encrypt(publicKeyB, Buffer.from(MSG))
}

// Encrypting the message for A.
CumtumEnc.eccA = function(){
  eccrypto.encrypt(publicKeyA, Buffer.from("msg to a")).then(function(encrypted) {
    // A decrypting the message.
    eccrypto.decrypt(privateKeyA, encrypted).then(function(plaintext) {
      console.log("Message to part A:", plaintext.toString());
    });
  });
}

module.exports = CumtumEnc;