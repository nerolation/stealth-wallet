const keccak256 = require('js-sha3').keccak256;
const secp = require("@noble/secp256k1");
const ethers = require('ethers');
var CryptoJS = require("crypto-js");

function randomPrivateKey() {
  var randPrivateKey = secp.utils.randomPrivateKey();
  return BigInt(`0x${Buffer.from(randPrivateKey, "hex").toString('hex')}`);
}

function uintArrayToHex(uintArray) {
  return secp.utils.bytesToHex(uintArray);
}

global.toEthAddress = function toEthAddress(PublicKey) {
  var stAA = keccak256( Buffer.from(PublicKey, 'hex').slice(1)).toString(16);
  return "0x"+stAA.slice(-40);
}

global.encrypt_raw_tx = function encrypt_raw_tx(rawTx, key) {
  console.log("-------------\nEncrypting finalization tx...");
  const ciphertext = CryptoJS.AES.encrypt(rawTx, key);
  console.log(`Tx encrypted:\n${ciphertext.toString()}`);
  const ciphertextArray = CryptoJS.enc.Base64.parse(ciphertext.toString());
  console.log(`Tx encrypted:\n${CryptoJS.enc.Hex.stringify(ciphertextArray)}`);
  //console.log(`Tx encrypted:\n${CryptoJS.enc.Hex.stringify(ciphertextArray)}`);
  return CryptoJS.enc.Hex.stringify(ciphertextArray);
}

global.decrypt_tx = function decrypt_tx(cipher, key) {
  console.log("-------------\nDecrypting finalization tx...");
  ciphertext = hexToBase64(cipher);
  const decrypted = CryptoJS.AES.decrypt(ciphertext, key);
  const rawTx = decrypted.toString(CryptoJS.enc.Utf8);
  console.log(`Tx decrypted:\n${rawTx}`);
  return rawTx;
}

function hexToBase64(hexString) {
  console.log(Buffer.from(hexString, 'hex').toString('base64'));
  return Buffer.from(hexString, 'hex').toString('base64');
}

global.generateStealthInfo = function generateStealthInfo(stealthMetaAddress) {
  //USER = "st:eth:0x03312f36039e1479d10ba17eef98bba5f9a299af277c1dfac2e9134f352892b16603312f36039e1479d10ba17eef98bba5f9a299af277c1dfac2e9134f352892b166";

  const USER = stealthMetaAddress;
  if (!USER.startsWith("st:eth:0x")){
    throw "Wrong address format; Address must start with `st:eth:0x...`";
  }

  const R_pubkey_spend = secp.Point.fromHex(USER.slice(9,75));
  //console.log('R_pubkey_spend:', R_pubkey_spend);

  const R_pubkey_view = secp.Point.fromHex(USER.slice(75,));

//  const randomInt = BigInt(`0x${hexString}`);

  const ephemeralPrivateKey = randomPrivateKey();
;
  //console.log('ephemeralPrivateKey:', "0x" + ephemeralPrivateKey.toString(16));

  const ephemeralPublicKey = secp.getPublicKey(ephemeralPrivateKey, isCompressed=true);
  //console.log('ephemeralPublicKey:', Buffer.from(ephemeralPublicKey).toString('hex'));

  const sharedSecret = secp.getSharedSecret(ephemeralPrivateKey, R_pubkey_view);
  //console.log('sharedSecret:', sharedSecret);

  var hashedSharedSecret = keccak256(Buffer.from(sharedSecret.slice(1)));
  //console.log('hashedSharedSecret:', hashedSharedSecret);

  var ViewTag = hashedSharedSecret.slice(0,2);
  //console.log('View tag:', ViewTag.toString('hex'));
  const hashedSharedSecretPoint = secp.Point.fromPrivateKey(Buffer.from(hashedSharedSecret, "hex"));
  //console.log('hashedSharedSecretPoint1:', hashedSharedSecretPoint);
  const stealthPublicKey = R_pubkey_spend.add(hashedSharedSecretPoint);
  //console.log("stealthPublicKey.toHex(): ", stealthPublicKey.toHex());
  const stealthAddress = toEthAddress(stealthPublicKey.toHex());
  //console.log('stealth address:', stealthAddress);
  return {"stealthAddress":stealthAddress, "ephemeralPublicKey":"0x"+Buffer.from(ephemeralPublicKey).toString('hex'), "ViewTag":"0x"+ViewTag.toString('hex'), "HashedSecret":hashedSharedSecret};
}
////console.log("generateStealthInfo......................");
//var info = generateStealthInfo("st:eth:0x02b69f343a19fa77a07ba1d106f54c35d5f4394dafd2cbc03a52b1f7b51ffd7c15024f41330ec0e0ba6aab92e3b247057405560035b9afce2c65de16040ace97d43a");
////console.log("------------------++++++++++++++++++++++++++++++++++++++++++++++++++++---------------");

global.parseStealthAddresses = function parseStealthAddresses(
  ephemeralPublicKey_hex,
  stealthAddress_given,
  spendingPublicKey_hex,
  viewingPrivateKey,
  viewTag_given
){
  //console.log("ephemeralPublicKey_hex :",ephemeralPublicKey_hex);

  var ephemeralPublicKey = secp.Point.fromHex(ephemeralPublicKey_hex.slice(2));
  ////console.log('ephemeralPublicKey_hex:', ephemeralPublicKey_hex);

  const spendingPublicKey = secp.Point.fromHex(spendingPublicKey_hex.slice(2), isCompressed=true);
  //console.log('spendingPublicKey:', spendingPublicKey);


  const sharedSecret = secp.getSharedSecret(BigInt(viewingPrivateKey), ephemeralPublicKey);
  //console.log('sharedSecret:', sharedSecret);

  var hashedSharedSecret = keccak256(Buffer.from(sharedSecret.slice(1)));
  //console.log("hashedSharedSecret2 :",hashedSharedSecret);

  var ViewTag = hashedSharedSecret.slice(0,2).toString('hex');
  //console.log('View tag:', ViewTag);
  //console.log('View tag given:', viewTag_given);
  if (viewTag_given != ViewTag) {
    //console.log("skipped thanks to view tag;")
    return false;
  }

  const hashedSharedSecretPoint = secp.Point.fromPrivateKey(Buffer.from(hashedSharedSecret, "hex"));
  //console.log('hashedSharedSecretPoint1:', hashedSharedSecretPoint);

  ////console.log('hashedSharedSecretPoint:', hashedSharedSecretPoint);
  const stealthPublicKey = spendingPublicKey.add(hashedSharedSecretPoint);
  //console.log("stealthPublicKey :",stealthPublicKey.toHex());

  const stealthAddress = toEthAddress(stealthPublicKey.toHex());
  //console.log(stealthAddress);
  //console.log(stealthAddress_given);
  if (stealthAddress === stealthAddress_given) {
    return [stealthAddress, ephemeralPublicKey_hex,  "0x" + hashedSharedSecret.toString('hex')];
  }
  return false;
}
////console.log("parseStealthAddresses......................");
//success = parseStealthAddresses(
//  info["ephemeralPublicKey"],
//  info["stealthAddress"],
//  "0x02b69f343a19fa77a07ba1d106f54c35d5f4394dafd2cbc03a52b1f7b51ffd7c15",
//  "0x56fdd8d2a89366477762cf13ca47a3dac777af62dfdbaa81a7de54b7da0da21c"
//)
////console.log(success);
////console.log("-----------------------------------------------------");
////console.log("privToAddress......................");

global.privToAddress = function privToAddress(
  stealthPrivateKey
){
  var stealthPublicKey = secp.Point.fromPrivateKey(stealthPrivateKey);
  var stealthAddress = toEthAddress(stealthPublicKey.toHex());
  return  stealthPublicKey.toHex(isCompressed=true), stealthAddress;
}

global.generateRandomStealthMetaAddress = function generateRandomStealthMetaAddress() {
  const spendingPrivateKey = randomPrivateKey();
  const viewingPrivateKey = randomPrivateKey();
  const spendingPublicKey = uintArrayToHex(secp.getPublicKey(spendingPrivateKey, isCompressed=true));
  const viewingPublicKey = uintArrayToHex(secp.getPublicKey(viewingPrivateKey, isCompressed=true));
  const stealthMetaAddress = "st:eth:0x"+spendingPublicKey+viewingPublicKey;
  return ["0x"+spendingPrivateKey.toString(16), "0x"+viewingPrivateKey.toString(16), "0x"+spendingPublicKey, "0x"+viewingPublicKey, stealthMetaAddress]
}
//generateRandomStealthMetaAddress();
//var stealthPrivateKey = BigInt("0x"+success[2]) + BigInt("0x5ae07d3818695379db1e82a684e1be374b5c4dc40dc8a754adf45cdcb9a4d784");

//stealthAddress_derived = privToAddress(stealthPrivateKey);
////console.log("stealthAddress_derived: ", stealthAddress_derived);


global.stringAndBytesToKeccakHash = function stringAndBytesToKeccakHash(stealthAddress, random) {

  // Convert stealthAddress to a proper address format
  const formattedStealthAddress = ethers.utils.getAddress(stealthAddress);

  const hash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(['address', 'uint256'], [formattedStealthAddress, random])
  );

  // Calculate and return the keccak256 hash of the concatenated bytes
  return hash;
}
