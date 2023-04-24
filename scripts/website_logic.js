/**
 * Copy text from a div element to the clipboard.
 */
function copyTextFromDiv(divID) {
    // Get the text from the div element.
    const divText = document.getElementById(divID).innerText;

    // Create a new textarea element and set its value to the div text.
    const textArea = document.createElement('textarea');
    textArea.value = divText;

    // Add the textarea to the document, select its content, and copy it to the clipboard.
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');

    // Remove the textarea from the document.
    document.body.removeChild(textArea);
}

/**
 * Copy text from a textarea or input element to the clipboard.
 */
function copyTextFromTextField(textAreaID) {
    // Get the textarea or input element and select its content.
    const textArea = document.getElementById(textAreaID);
    textArea.select();

    // Copy the selected content to the clipboard.
    document.execCommand('copy');
}

function checkHash(hash) {
    // Retrieve the stored hashes from localStorage
    let storedHashes = localStorage.getItem('hashes');

    // If no hashes have been stored yet, return false
    if (!storedHashes) {
        return false;
    } else {
        // If hashes have been stored, parse the JSON string into an array
        storedHashes = JSON.parse(storedHashes);
    }

    // Check if the given hash is already in the storedHashes array
    return storedHashes.includes(hash);
}

function storeHash(hash) {
    // Retrieve the stored hashes from localStorage
    let storedHashes = localStorage.getItem('hashes');

    // If no hashes have been stored yet, create an empty array
    if (!storedHashes) {
        storedHashes = [];
    } else {
        // If hashes have been stored, parse the JSON string into an array
        storedHashes = JSON.parse(storedHashes);
    }

    // Add the new hash to the storedHashes array
    storedHashes.push(hash);

    // Update the localStorage with the new array, converting it back to a JSON string
    localStorage.setItem('hashes', JSON.stringify(storedHashes));
}

/**
 * Pad a number string with zeros to reach a minimum of 4 bytes (8 characters).
 */
function padToOneByte(number) {
    // Define the target length for the padded number string.
    const targetLength = 2; // 4 bytes * 2 (each byte has 2 hex characters)

    // If the number string is already at least the target length, return it unchanged.
    if (number.length >= targetLength) {
        return number;
    }

    // Calculate the required zero padding.
    const zeroPadding = '0'.repeat(targetLength - number.length);

    // Append the zero padding to the end of the number string and return it.
    return number + zeroPadding;
}



window.onload = function() {
    const web3 = new Web3(window.ethereum);
    const userAddressElement = document.getElementById('user-address');
    const interactionElements = document.getElementById('user-stealth-meta-address');
    const userStealthMetaAddressElement = document.getElementById('stealth-meta-address');
    const parsingOutputStealthAddress = document.getElementById('parsing-output-stealth-address');
    const parsingForm = document.getElementById('parsing-form');
    const parsingOutputPrivateKey = document.getElementById('parsing-output-stealth-private-key');
    const loginPage = document.getElementById('login');
    document.getElementById('ephemeral-key-toggle').checked = false;
    document.getElementById('flexSwitchCheckDefault').checked = false;

    document.getElementById('enter-button').addEventListener('click', () => {
        const welcomeScreen = document.getElementById('welcome-screen');
        const mainInterface = document.getElementById('main-interface');
        welcomeScreen.classList.add('hide');
        mainInterface.classList.add('move-up');
    });

    document.getElementById('basic-addon2').addEventListener('click', function() {
        const parsingOutputStealthAddress = document.getElementById('parsing-output-stealth-address').value;
        var url = "https://sepolia.etherscan.io/address/" + parsingOutputStealthAddress;
        window.open(url, '_blank').focus();
    });

    document.getElementById('copybuttonSPK').addEventListener('click', function() {
        copyTextFromTextField('parsing-output-stealth-private-key');
        document.getElementById('copybuttonSPK').innerText = "Copied";
    });

    document.getElementById('copybuttonSMA').addEventListener('click', function() {
        copyTextFromDiv('stealth-meta-address');
        document.getElementById('copybuttonSMA').innerText = "Copied";
    });

    document.getElementById('tab1-btn').addEventListener('click', function() {
        document.getElementById('tab1').style.display = 'block';
        document.getElementById('tab2').style.display = 'none';
        document.getElementById('tab1-btn').classList.add('btn-primary');
        document.getElementById('tab1-btn').classList.remove('btn-secondary');
        document.getElementById('tab2-btn').classList.add('btn-secondary');
        document.getElementById('tab2-btn').classList.remove('btn-primary');
    });
    document.getElementById('tab2-btn').addEventListener('click', function() {
        document.getElementById('tab1').style.display = 'none';
        document.getElementById('tab2').style.display = 'block';
        document.getElementById('tab1-btn').classList.add('btn-secondary');
        document.getElementById('tab1-btn').classList.remove('btn-primary');
        document.getElementById('tab2-btn').classList.add('btn-primary');
        document.getElementById('tab2-btn').classList.remove('btn-secondary');
    });

    const toggle = document.getElementById('ephemeral-key-toggle');
    const ephemeralKeyInput = document.querySelector('.ephemeral-key-input');
    const parseBtn = document.getElementById('parse-btn');

    toggle.addEventListener('change', () => {
      ephemeralKeyInput.style.display = toggle.checked ? 'block' : 'none';
      parseBtn.textContent = toggle.checked ? "Let's go" : 'Parse';
    });
    // Connect Wallet button
    document.getElementById('connect-wallet-btn').addEventListener('click', async function() {
        // Check if Metamask is installed
        if (typeof window.ethereum !== 'undefined') {
            console.log('Metamask is installed!');
            try {
                // Connect to Metamask and get accounts
                const accounts = await ethereum.request({
                    method: 'eth_requestAccounts'
                });
                const account = accounts[0];
                console.log('Connected to Metamask!');
                console.log('Current account:', account);
                userAddressElement.innerHTML = `Connected as: ${accounts[0]}`;
                userAddressElement.classList.remove('d-none');
                loginPage.classList.remove('d-none');
                interactionElements.classList.add('d-none');
            } catch (error) {
                console.log('Metamask connection error:', error);
            }
        } else {
            console.log('Metamask is not installed!');
            window.alert('Metamask is not installed!');
        }
    });
    // Sign Message button
    document.getElementById('sign-message-btn').addEventListener('click', async function(event) {
        event.preventDefault();
        const accounts = await ethereum.request({
            method: 'eth_requestAccounts'
        });
        const account = accounts[0];
        const exampleMessage = 'I want to login into my stealth wallet on Ethereum mainnet.';
        try {
            const from = accounts[0];
            const hexString = web3.utils.utf8ToHex(exampleMessage);
            const msg = `0x${hexString.slice(2)}`;
            const signature = await ethereum.request({
                method: 'personal_sign',
                params: [msg, from],
            });
            const sig1 = signature.slice(2, 66);
            const sig2 = signature.slice(66, 130);
            console.log(sig1);
            console.log(sig2);
            // Hash "v" and "r" values using SHA-256
            const hashedV = ethers.utils.sha256("0x" + sig1);
            const hashedR = ethers.utils.sha256("0x" + sig2);
            const n = ethers.BigNumber.from('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
            // Calculate the private keys by taking the hash values modulo the curve order
            const privateKey1 = ethers.BigNumber.from(hashedV).mod(n);
            const privateKey2 = ethers.BigNumber.from(hashedR).mod(n);
            // Generate the key pairs
            const keyPair1 = new ethers.Wallet(privateKey1.toHexString());
            const keyPair2 = new ethers.Wallet(privateKey2.toHexString());
            window.spendingPrivateKey = keyPair1.privateKey;
            window.viewingPrivateKey = keyPair2.privateKey;
            const spendingPublicKey = ethers.utils.computePublicKey(keyPair1.privateKey, true);
            const viewingPublicKey = ethers.utils.computePublicKey(keyPair2.privateKey, true);
            window.spendingPublicKey = spendingPublicKey;
            window.viewingPublicKey = viewingPublicKey;
            userStealthMetaAddressElement.innerHTML = `st:eth:${spendingPublicKey}${viewingPublicKey.slice(2,)}`;
            interactionElements.classList.remove('d-none');
            loginPage.classList.add('d-none');
        } catch (err) {
            console.error(err);
            window.alert(err.message);
        }
    });
    window.skipParsingIteration = 0;
    document.getElementById('parse-btn').addEventListener('click', async function() {
        // Get the input values
        const spendingPublicKey = window.spendingPublicKey;
        const viewingPrivateKey = window.viewingPrivateKey;
        if (document.getElementById('ephemeral-key-toggle').checked) {
          const providedEmphemeralKey = document.getElementById("ephemeral-public-key").value;
          try {
            var stealthInfo = optimisticParsing(providedEmphemeralKey, spendingPublicKey, viewingPrivateKey);
            var stealthAddress = stealthInfo[0];
            var ephemeralPublicKey = stealthInfo[1];
            var hashedSharedSecret = stealthInfo[2];
            var stealthPrivateKey = (BigInt(window.spendingPrivateKey) + BigInt(hashedSharedSecret)) % BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
            stealthPrivateKeyString = stealthPrivateKey.toString(16);
            stealthPrivateKeyString = "0x" + stealthPrivateKeyString.padStart(64, '0');
            var stealthAddress = privToAddress(stealthPrivateKey);
            parsingOutputStealthAddress.value = stealthAddress;
            parsingOutputPrivateKey.value = stealthPrivateKeyString;
            parsingForm.classList.remove('d-none');
            parsingOutputStealthAddress.classList.add('is-valid');
            parsingOutputPrivateKey.classList.add('is-valid');
            parsingOutputPrivateKey.classList.remove('is-invalid');
            parsingOutputStealthAddress.classList.remove('is-invalid');
          } catch (err) {
            console.error(err);
            parsingOutputStealthAddress.classList.remove('d-none');
            parsingOutputPrivateKey.classList.remove('d-none');
            parsingOutputStealthAddress.classList.add('is-invalid');
            parsingOutputPrivateKey.classList.add('is-invalid');
            parsingOutputPrivateKey.classList.remove('is-valid');
            parsingOutputStealthAddress.classList.remove('is-valid');
            parsingOutputStealthAddress.value = "Nothing found.";
            parsingOutputPrivateKey.value = "Nothing found;";
          }
        } else {
          fetch('https://europe-west3-ethereum-data-nero.cloudfunctions.net/csv_to_json').then(response => response.text()).then(data => {
              const rows = JSON.parse(data);
              console.log(JSON.parse(data));
              window.announcements = rows;
              var foundStealthAddresses = 0;
              for (let i = 0; i < rows.length; i++) {
                  var announcement = window.announcements[i];
                  if (!announcement["ephemeralPubKey"]) {
                      continue;
                  }
                  console.log(spendingPublicKey);
                  console.log(viewingPrivateKey);
                  try {
                      var stealthInfo = parseStealthAddresses(announcement["ephemeralPubKey"], announcement["stealthAddress"].toLowerCase(), spendingPublicKey, viewingPrivateKey, announcement["metadata"].slice(2, 4));
                  } catch (err) {
                      console.error(err);
                      console.error("Failed parsing announcement:");
                      console.error(announcement);
                  }
                  window.foundStealthInfo = false;
                  if (stealthInfo === false) {
                      continue;
                  }
                  foundStealthAddresses += 1;
                  if (foundStealthAddresses <= window.skipParsingIteration) {
                      continue;
                  }
                  window.foundStealthInfo = true;
                  window.skipParsingIteration += 1;
                  var stealthAddress = stealthInfo[0];
                  var ephemeralPublicKey = stealthInfo[1];
                  var hashedSharedSecret = stealthInfo[2];
                  console.log("hashedSharedSecret", hashedSharedSecret);
                  var stealthPrivateKey = (BigInt(window.spendingPrivateKey) + BigInt(hashedSharedSecret)) % BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
                  stealthPrivateKeyString = stealthPrivateKey.toString(16);
                  stealthPrivateKeyString = "0x" + stealthPrivateKeyString.padStart(64, '0');
                  var stealthAddress = privToAddress(stealthPrivateKey);
                  parsingOutputStealthAddress.value = stealthAddress;
                  parsingOutputPrivateKey.value = stealthPrivateKeyString;
                  parsingForm.classList.remove('d-none');
                  document.getElementById('parse-btn').innerText = "Continue parsing";
                  if (announcement["schemeID"] == 2) {
                      if (!checkHash(ephemeralPublicKey)) {
                          window.ephemeralPublicKey = ephemeralPublicKey;
                          manage_decrypt_transaction(announcement["metadata"].slice(4, ), hashedSharedSecret.slice(2, ), stealthAddress);
                      } else {
                          continue;
                      }

                  }
                  break
              }
              if (window.foundStealthInfo === false) {
                  window.skipParsingIteration = 0;
                  parsingOutputStealthAddress.classList.remove('d-none');
                  parsingOutputPrivateKey.classList.remove('d-none');
                  parsingOutputStealthAddress.classList.add('is-invalid');
                  parsingOutputPrivateKey.classList.add('is-invalid');
                  parsingOutputPrivateKey.classList.remove('is-valid');
                  parsingOutputStealthAddress.classList.remove('is-valid');
                  parsingOutputStealthAddress.value = "Nothing found.";
                  parsingOutputPrivateKey.value = "Nothing found;";
              } else {
                  parsingOutputStealthAddress.classList.add('is-valid');
                  parsingOutputPrivateKey.classList.add('is-valid');
                  parsingOutputPrivateKey.classList.remove('is-invalid');
                  parsingOutputStealthAddress.classList.remove('is-invalid');
              }
          }).catch(error => console.error(error));
        }
      });
    document.getElementById('send-btn').addEventListener('click', async function() {
        // Get the input values
        const inputStealthMetaAddress = document.getElementById('input-stealth-meta-address').value.trim();
        const inputAmount = document.getElementById('input-amount').value.trim();
        const toggleStatus = document.getElementById('flexSwitchCheckDefault').checked;
        // Input validation
        const stealthMetaAddressPattern = /^st:eth:0x[a-fA-F0-9]{132}$/;
        const amountPattern = /^\d+(\.\d{1,18})?$/;
        if (!stealthMetaAddressPattern.test(inputStealthMetaAddress)) {
            alert('Please enter a valid stealth meta-address. It should start with "st:eth:0x" and followed by 128 characters in the range of 0-9 and a-fA-F.');
            return;
        }
        if (!amountPattern.test(inputAmount)) {
            alert('Please enter a valid amount. It must be a positive number with up to 18 decimal places.');
            return;
        }
        try {
            var stealthAddressInfo = generateStealthInfo(inputStealthMetaAddress);
            console.log(stealthAddressInfo);
            var sta = stealthAddressInfo["stealthAddress"];
            var ephk = stealthAddressInfo["ephemeralPublicKey"];
            var vt = stealthAddressInfo["ViewTag"];
            var hs = stealthAddressInfo["HashedSecret"];
            vt = padToOneByte(vt);
        } catch (error) {
            console.log(error);
        }
        // Show the transaction summary in the modal
        document.getElementById('modal-stealth-address').innerHTML = `Stealth Address: ${sta}`;
        document.getElementById('modal-amount').innerHTML = `Amount <span class="icon-ok-sign" data-bs-toggle="tooltip" data-bs-html="true"
        data-bs-placement="top" title="Note that 0.001 ETH from the amount are directly deposited into the Messenger contract if you have not already done so. The deposit represents an anti-DoS measure and can be withdrawn at any time. Furthermore, it is unslashable. Staking provides your recipients with prioritized treatment in the parsing process.">
          <img class="bi bi-info-circle-fill" src="static/img/info-circle-fill.svg"></img>
        </span>: ${inputAmount} ETH`;
        document.getElementById('modal-status').innerHTML = 'Status: Waiting for confirmation...';
        const transactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));
        transactionModal.show();
        // Convert the input amount from ETH to Wei
        const inputAmountWei = web3.utils.toWei(inputAmount, 'ether');
        // Get the current account
        const accounts = await ethereum.request({
            method: 'eth_requestAccounts'
        });
        const fromAccount = accounts[0];
        // Prepare the transaction data
        if (toggleStatus === true) {
            escrowTransaction(fromAccount, inputAmountWei, sta, ephk, vt, hs);
        } else {
            const transferAndAnnounceData = helperContract.methods.transferAndStakeAndAnnounce(sta, ephk, vt).encodeABI();
            // Create the transaction object
            const tx = {
                from: fromAccount,
                to: contractAddress,
                value: inputAmountWei,
                data: transferAndAnnounceData,
                gas: 150000
            };
            // Send the transaction and update the modal with the transaction hash
            web3.eth.sendTransaction(tx)
                .on('transactionHash', function(hash) {
                    console.log('Transaction hash:', hash);
                })
                .on('receipt', function(receipt) {
                    console.log('Transaction receipt:', receipt);
                })
                .on('confirmation', function(confirmationNumber, receipt) {
                    console.log('Transaction confirmation number:', confirmationNumber);
                    console.log('Transaction receipt:', receipt);
                    // Update the modal status with the transaction hash
                    const shortHash = receipt.transactionHash.slice(0, 14) + '...';
                    document.getElementById('modal-status').innerHTML = `Status: Confirmed<br>Transaction Hash: <a href="https://sepolia.etherscan.io/tx/${receipt.transactionHash}" target="_blank">${shortHash}</a>`;
                })
                .on('error', function(error) {
                    console.error('Transaction error:', error);
                    // Update the modal status with the error message
                    document.getElementById('modal-status').innerHTML = `Status: Error<br>${error.message}`;
                });
        }
    });
    const contractABI = [{
            "inputs": [{
                    "internalType": "address",
                    "name": "stealthAddress",
                    "type": "address"
                },
                {
                    "internalType": "bytes32",
                    "name": "r",
                    "type": "bytes32"
                },
                {
                    "internalType": "bytes32",
                    "name": "s",
                    "type": "bytes32"
                },
                {
                    "internalType": "uint8",
                    "name": "v",
                    "type": "uint8"
                },
                {
                    "internalType": "uint256",
                    "name": "random",
                    "type": "uint256"
                }
            ],
            "name": "finalizeEscrowPosition",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{
                    "internalType": "address",
                    "name": "recipient",
                    "type": "address"
                },
                {
                    "internalType": "bytes",
                    "name": "ephemeralPubKey",
                    "type": "bytes"
                },
                {
                    "internalType": "bytes",
                    "name": "metadata",
                    "type": "bytes"
                },
                {
                    "internalType": "address",
                    "name": "requiredSigner",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "spendingAccount",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "finalGas",
                    "type": "uint256"
                }
            ],
            "name": "secureTransferAndStakeAndAnnounce",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [{
                    "internalType": "address",
                    "name": "recipient",
                    "type": "address"
                },
                {
                    "internalType": "bytes",
                    "name": "ephemeralPubKey",
                    "type": "bytes"
                },
                {
                    "internalType": "bytes",
                    "name": "metadata",
                    "type": "bytes"
                }
            ],
            "name": "transferAndAnnounce",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [{
                    "internalType": "address",
                    "name": "recipient",
                    "type": "address"
                },
                {
                    "internalType": "bytes",
                    "name": "ephemeralPubKey",
                    "type": "bytes"
                },
                {
                    "internalType": "bytes",
                    "name": "metadata",
                    "type": "bytes"
                }
            ],
            "name": "transferAndStakeAndAnnounce",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [{
                    "internalType": "address payable",
                    "name": "messengerAddress",
                    "type": "address"
                },
                {
                    "internalType": "address payable",
                    "name": "escrowAddress",
                    "type": "address"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [{
                "internalType": "address",
                "name": "",
                "type": "address"
            }],
            "name": "escrowFunding",
            "outputs": [{
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }],
            "stateMutability": "view",
            "type": "function"
        }
    ];
    console.log(contractABI);
    const contractAddress = "0x80eD67268c03a4e9134aD77f05Ee30E2370483F0";
    const helperContract = new web3.eth.Contract(contractABI, contractAddress);
    console.log("----------------------------------------")

    function validateStealthMetaAddress(stealthMetaAddress) {
        // Replace this with your specific validation logic
        return /^st:eth:0x[a-fA-F0-9]{132}$/.test(stealthMetaAddress);
    }

    const inputStealthMetaAddress = document.getElementById('input-stealth-meta-address');
    inputStealthMetaAddress.addEventListener('input', (event) => {
        const value = event.target.value;
        const isValid = validateStealthMetaAddress(value);

        if (isValid) {
            // Input is valid, remove any error styling
            event.target.classList.remove('is-invalid');
            event.target.classList.add('is-valid');
        } else {
            // Input is invalid, add error styling
            event.target.classList.remove('is-valid');
            event.target.classList.add('is-invalid');
        }
    })

    const ABI = [{
            "inputs": [{
                    "internalType": "address",
                    "name": "stealthAddress",
                    "type": "address"
                },
                {
                    "internalType": "bytes32",
                    "name": "r",
                    "type": "bytes32"
                },
                {
                    "internalType": "bytes32",
                    "name": "s",
                    "type": "bytes32"
                },
                {
                    "internalType": "uint8",
                    "name": "v",
                    "type": "uint8"
                },
                {
                    "internalType": "uint256",
                    "name": "random",
                    "type": "uint256"
                }
            ],
            "name": "finalizePosition",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{
                    "internalType": "address",
                    "name": "requiredSigner",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "stealthAddress",
                    "type": "address"
                }
            ],
            "name": "initiatePosition",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [{
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "positionAge",
            "outputs": [{
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "positions",
            "outputs": [{
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{
                    "internalType": "address",
                    "name": "stealthAddress",
                    "type": "address"
                },
                {
                    "internalType": "bytes32",
                    "name": "r",
                    "type": "bytes32"
                },
                {
                    "internalType": "bytes32",
                    "name": "s",
                    "type": "bytes32"
                },
                {
                    "internalType": "uint8",
                    "name": "v",
                    "type": "uint8"
                },
                {
                    "internalType": "uint256",
                    "name": "random",
                    "type": "uint256"
                }
            ],
            "name": "rescuePosition",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
    // Replace with the actual ABI of your contract
    const contract_address = "0x2b0b589478AA5F8BA93D87C240a7e58fd15A1746"; // Replace with the actual contract address
    const escrowContract = new web3.eth.Contract(ABI, contract_address);
    console.log(escrowContract);

    async function escrowTransaction(account, value, sta, ephk, vt, hs) {
        console.log("escrowContract", escrowContract);
        console.log("escrowContract", helperContract);
        console.log("Initiating escrow tx...");
        const nonce = await web3.eth.getTransactionCount(account);
        spendingKeyAccount = web3.eth.accounts.privateKeyToAccount(spendingPrivateKey).address;

        function generateRandomInteger(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        const random = generateRandomInteger(0, Number.MAX_SAFE_INTEGER);

        console.log("random ", random);
        console.log("sta ", sta);

        var hashedMsg = stringAndBytesToKeccakHash(sta, random);
        console.log("hashedMsg ", hashedMsg);

        var hashedMsg2 = web3.utils.soliditySha3(sta, random);
        console.log("hasedMsg ", hashedMsg2);

        const signature = web3.eth.accounts.sign(hashedMsg2, spendingPrivateKey);
        console.log("signature ", signature);

        // Extract r, s, and v from the signature
        const {
            r,
            s,
            v
        } = signature;
        console.log("r ", r);
        console.log("s ", s);
        console.log("v ", v);

        const signerAddress = web3.eth.accounts.recover({
            messageHash: signature.messageHash,
            v: v,
            r: r,
            s: s
        })
        console.log("Signer address: ", signerAddress);

        const data_final = helperContract.methods.finalizeEscrowPosition(sta, r, s, parseInt(v, 16), random).encodeABI();
        const tx_final = {
            to: contractAddress,
            from: spendingKeyAccount,
            value: 0,
            gas: 150000,
            gasPrice: Math.ceil((await web3.eth.getGasPrice()) * 1.1),
            data: data_final,
        };
        const signedTx = await web3.eth.accounts.signTransaction(tx_final, spendingPrivateKey);
        //const tx = web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log(signedTx);
        console.log(helperContract);
        const encryptedTx = encrypt_raw_tx(signedTx.rawTransaction, hs).toString(16)
        console.log(encryptedTx);
        console.log("vt+encryptedTx", vt + encryptedTx);
        console.log("spendingPublicKey", spendingKeyAccount);
        const data_init = helperContract.methods.secureTransferAndStakeAndAnnounce(
            sta,
            ephk,
            vt + encryptedTx,
            spendingKeyAccount,
            spendingKeyAccount,
            web3.utils.toWei("0.001", 'ether')
        ).encodeABI();
        const tx_init = {
            to: contractAddress,
            from: account,
            value: value,
            gas: 500000,
            gasPrice: await web3.eth.getGasPrice(),
            nonce: nonce,
            data: data_init,
        };

        // Send the transaction and update the modal with the transaction hash
        web3.eth.sendTransaction(tx_init)
            .on('transactionHash', function(hash) {
                console.log('Transaction hash:', hash);
                const shortHash = hash.slice(0, 14) + '...';
                document.getElementById('modal-status').innerHTML = `Status: Pending<br>Transaction Hash: <a href="https://sepolia.etherscan.io/tx/${hash}" target="_blank">${shortHash}</a>`;

            })
            .on('receipt', function(receipt) {
                console.log('Transaction receipt:', receipt);
            })
            .on('confirmation', function(confirmationNumber, receipt) {
                console.log('Transaction confirmation number:', confirmationNumber);
                console.log('Transaction receipt:', receipt);
                // Update the modal status with the transaction hash
                const shortHash = receipt.transactionHash.slice(0, 14) + '...';
                document.getElementById('modal-status').innerHTML = `Status: Confirmed<br>Transaction Hash: <a href="https://sepolia.etherscan.io/tx/${receipt.transactionHash}" target="_blank">${shortHash}</a>`;
            })
            .on('error', function(error) {
                console.error('Transaction error:', error);
                // Update the modal status with the error message
                document.getElementById('modal-status').innerHTML = `Status: Error<br>${error.message}`;
            });
        console.log(`Tx sent: ${tx_init.transactionHash}`);
        return tx_init;
    }

    async function manage_decrypt_transaction(encryptedTx, key, stealthAddress) {
        const decryptedTx = decrypt_tx(encryptedTx, key);
        console.log(decryptedTx);
        window.decryptedTx = decryptedTx;
        console.log("ephemeralPubKey-------------------------", window.ephemeralPublicKey);
        document.getElementById('pmodal-stealth-address').innerHTML = `Stealth Address: <a href="https://sepolia.etherscan.io/address/${stealthAddress}" target="_blank">${stealthAddress}</a>`;
        document.getElementById('claimEscrow').classList.remove("d-none");
        document.getElementById('pmodal-status').innerHTML = "Status: Ready";
        const parsingModal = new bootstrap.Modal(document.getElementById('parsingModal'));
        parsingModal.show();
        return encryptedTx;
    }
    document.getElementById('claimEscrow').addEventListener('click', async function() {
        const txReceipt = web3.eth.sendSignedTransaction(window.decryptedTx).on('transactionHash', function(hash) {
                const shortHash = hash.slice(0, 14) + '...';
                document.getElementById('pmodal-status').innerHTML = `Status: Pending<br>Transaction Hash: <a href="https://sepolia.etherscan.io/tx/${hash}" target="_blank">${shortHash}</a>`;
                document.getElementById('claimEscrow').classList.add("d-none");
            })
            .on('receipt', function(receipt) {
                //console.log('Transaction receipt:', receipt);
                const confettiEffect = createConfettiEffect();
                confettiEffect.start(window.innerWidth / 2, window.innerHeight / 3);
            })
            .on('confirmation', function(confirmationNumber, receipt) {
                console.log('-------------------------------------------------------');
                console.log('Transaction confirmation number:', confirmationNumber);
                console.log('Transaction receipt:', receipt);
                console.log(window.ephemeralPublicKey);
                storeHash(window.ephemeralPublicKey);
                if (!checkHash(window.ephemeralPublicKey)) {
                    storeHash(window.ephemeralPublicKey);
                }
                const shortHash = receipt.transactionHash.slice(0, 14) + '...';
                // Update the modal status with the transaction hash
                document.getElementById('pmodal-status').innerHTML = `Status: Confirmed<br>Transaction Hash: <a href="https://sepolia.etherscan.io/tx/${receipt.transactionHash}" target="_blank">${shortHash}</a>`;
            })
            .on('error', function(error) {
                console.error('Transaction error:', error);
                document.getElementById('claimEscrow').classList.add("d-none");
                if (!checkHash(window.ephemeralPublicKey)) {
                    storeHash(window.ephemeralPublicKey);
                }
                // Update the modal status with the error message
                document.getElementById('pmodal-status').innerHTML = `Status: Error<br>${error.message}<br> either the recipient has canceled the escrow transaction or it has already been executed.`;
            });
    })
};
