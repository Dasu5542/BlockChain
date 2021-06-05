var eccrypto = require("eccrypto");

var privateKeyA = eccrypto.generatePrivate();
var publicKeyA = eccrypto.getPublic(privateKeyA);
var privateKeyB = eccrypto.generatePrivate();
var publicKeyB = eccrypto.getPublic(privateKeyB);

var CumtumEnc = {};

console.log(privateKeyA);
// Encrypting the message for B.
CumtumEnc.eccB = function(MSG){
  eccrypto.encrypt(publicKeyB, Buffer.from(MSG)).then(function(encrypted) {
    // B decrypting the message.
    eccrypto.decrypt(privateKeyB, encrypted).then(function(plaintext) {
      console.log("Message to part B:", plaintext.toString());
    });
  });
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