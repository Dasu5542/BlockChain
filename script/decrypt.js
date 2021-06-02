var eccrypto = require("eccrypto");

var privateKeyA = eccrypto.generatePrivate();
var publicKeyA = eccrypto.getPublic(privateKeyA);
var privateKeyB = eccrypto.generatePrivate();
var publicKeyB = eccrypto.getPublic(privateKeyB);

console.log(privateKeyA);
// Encrypting the message for B.
eccrypto.encrypt(publicKeyB, Buffer.from("bcde")).then(function(encrypted) {
  // B decrypting the message.
  eccrypto.decrypt(privateKeyB, encrypted).then(function(plaintext) {
    console.log("Message to part B:", plaintext.toString());
  });
});

// Encrypting the message for A.
eccrypto.encrypt(publicKeyA, Buffer.from("msg to a")).then(function(encrypted) {
  // A decrypting the message.
  eccrypto.decrypt(privateKeyA, encrypted).then(function(plaintext) {
    console.log("Message to part A:", plaintext.toString());
  });
});