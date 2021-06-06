const { json } = require("body-parser");
var eccrypto = require("eccrypto");
var crypto = require("crypto");

var privateKeyA = eccrypto.generatePrivate();
var publicKeyA = eccrypto.getPublic(privateKeyA);
//var privateKeyB = eccrypto.generatePrivate();
//var privKeyB = ['5e', 'de', '9f', '23', 'ff', '4f', '60', '65', '86', 'ff', 'ed', 'f7', '45', 'b3', '7b', '3e', 'a0', '9a', '78', 'b2', '31', 'd8', 'e4', '29', 'c8', '93', '2a', '7d', '01', '83', '8e', '9c'];
var privKeyB = "e5d92033d78ad28f937b7a3bc5618a9840f03c46a28009563f2a0e23863fc074";
var privateKeyB = Buffer.from(privKeyB,'hex')
var publicKeyB = eccrypto.getPublic(privateKeyB);

var CustomEnc = {};

console.log(privateKeyB);
console.log(publicKeyB);
// Encrypting the message for B.
CustomEnc.eccEnc = async function(MSG){
  console.log("in ECC-Enc")
  return await eccrypto.encrypt(publicKeyB, Buffer.from(MSG))
}

CustomEnc.eccDec = async function(MSG){
  //console.log("in ECC-Dec")
  return await eccrypto.decrypt(publicKeyB, MSG)
}

// Encrypting the message for A.
CustomEnc.eccA = function(){
  eccrypto.encrypt(publicKeyA, Buffer.from("msg to a")).then(function(encrypted) {
    // A decrypting the message.
    eccrypto.decrypt(privateKeyA, encrypted).then(function(plaintext) {
      console.log("Message to part A:", plaintext.toString());
    });
  });
}

var privKey = "e5d92033d78ad28f937b7a3bc5618a9840f03c46a28009563f2a0e23863fc074";
var privateKey = Buffer.from(privKey,'hex');
// Corresponding uncompressed (65-byte) public key.
var publicKey = eccrypto.getPublic(privateKey);

CustomEnc.ecdsaSign = async function(strISBN){
  // Always hash you message to sign!
  var msg = crypto.createHash("sha256").update(strISBN).digest();
  return await eccrypto.sign(privateKey, msg)
}
CustomEnc.ecdsaVerify = async function(strISBN,sig){
  var msg = crypto.createHash("sha256").update(strISBN).digest();
  console.log("..........",sig)
  return await eccrypto.verify(publicKey, msg, sig).then(function(){console.log("OK!")})
}

/*
eccrypto.sign(privateKey, msg).then(function(sig) {
  console.log("Signature in DER format:", sig);
  eccrypto.verify(publicKey, msg, sig).then(function() {
    console.log("Signature is OK");
  }).catch(function() {
    console.log("Signature is BAD");
  });
});
*/



module.exports = CustomEnc;
