/**
 * Copy text from a div element to the clipboard.
 * @param {string} divID - The ID of the div element to copy text from.
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
 * @param {string} textAreaID - The ID of the textarea or input element to copy text from.
 */
function copyTextFromTextField(textAreaID) {
    // Get the textarea or input element and select its content.
    const textArea = document.getElementById(textAreaID);
    textArea.select();

    // Copy the selected content to the clipboard.
    document.execCommand('copy');
}

/**
 * Pad a number string with zeros to reach a minimum of 4 bytes (8 characters).
 * @param {string} number - The number string to pad.
 * @returns {string} - The padded number string.
 */
function padToMin4Bytes(number) {
    // Define the target length for the padded number string.
    const targetLength = 8; // 4 bytes * 2 (each byte has 2 hex characters)

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
        fetch('https://europe-west3-ethereum-data-nero.cloudfunctions.net/csv_to_json').then(response => response.text()).then(data => {
            const rows = JSON.parse(data);
            console.log(JSON.parse(data));
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
            }
            window.announcements = rows;
            var foundStealthAddresses = 0;
            for (let i = 0; i < rows.length; i++) {
                var announcement = window.announcements[i];
                if (!announcement["ephemeralPubKey"]) {
                    continue;
                }
                console.log(spendingPublicKey);
                console.log(viewingPrivateKey);
                var stealthInfo = parseStealthAddresses(announcement["ephemeralPubKey"], announcement["stealthAddress"].toLowerCase(), spendingPublicKey, viewingPrivateKey, announcement["metadata"].slice(2, 4));
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
                var stealthPrivateKey = (BigInt(window.spendingPrivateKey) + BigInt(hashedSharedSecret)) % BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
                stealthPrivateKeyString = stealthPrivateKey.toString(16);
                stealthPrivateKeyString = "0x" + stealthPrivateKeyString.padStart(64, '0');
                var stealthAddress = privToAddress(stealthPrivateKey);
                parsingOutputStealthAddress.value = stealthAddress
                parsingOutputPrivateKey.value = stealthPrivateKeyString
                parsingForm.classList.remove('d-none');
                document.getElementById('parse-btn').innerText = "Continue parsing";
                break
            }
            if (window.foundStealthInfo === false) {
                window.skipParsingIteration = 0;
                parsingOutputStealthAddress.classList.remove('d-none');
                parsingOutputPrivateKey.classList.remove('d-none');
                parsingOutputStealthAddress.classList.add('is-invalid');
                parsingOutputPrivateKey.classList.add('is-invalid')
                parsingOutputStealthAddress.value = "Nothing found.";
                parsingOutputPrivateKey.value = "Nothing found;"
            } else {
                parsingOutputStealthAddress.classList.add('is-valid');
                parsingOutputPrivateKey.classList.add('is-valid');
            }
        }).catch(error => console.error(error));
    });
    document.getElementById('send-btn').addEventListener('click', async function() {
        // Get the input values
        const inputStealthMetaAddress = document.getElementById('input-stealth-meta-address').value.trim();
        const inputAmount = document.getElementById('input-amount').value.trim();
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
            vt = padToMin4Bytes(vt);
        } catch (error) {
            console.log(error);
        }
        // Show the transaction summary in the modal
        document.getElementById('modal-stealth-address').innerHTML = `Stealth Address: ${sta}`;
        document.getElementById('modal-amount').innerHTML = `Amount <span class="icon-ok-sign" data-bs-toggle="tooltip"
        data-bs-placement="top" title="Note that 0.001 ETH from the amount are directly deposited into the Messenger contract if you have not already done so. The deposit represents an anti-DoS measure and can be withdrawn at any time. Furthermore, it is unslashable. Staking provides your recipients with prioritized treatment in the parsing process.">
          <img class="bi bi-info-circle-fill" src="info-circle-fill.svg"></img>
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
        const transferAndAnnounceData = contract.methods.transferAndStakeAndAnnounce(sta, ephk, vt).encodeABI();
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
    });
    const contractABI = {
        "inputs": [{
            "internalType": "address",
            "name": "recipient",
            "type": "address"
        }, {
            "internalType": "bytes",
            "name": "ephemeralPubKey",
            "type": "bytes"
        }, {
            "internalType": "bytes",
            "name": "metadata",
            "type": "bytes"
        }],
        "name": "transferAndStakeAndAnnounce",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
    console.log(contractABI);
    const contractAddress = "0x054Aa0E0b4C92142a583fDfa9369FF3558F8dea4";
    const contract = new web3.eth.Contract([contractABI], contractAddress);
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

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
};
