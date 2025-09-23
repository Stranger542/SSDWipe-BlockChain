let wipeData = null;
let verifyWipeData = null;
const recipientInput = document.getElementById('recipientInput');
const tokenUriInput = document.getElementById('tokenUriInput');

// --- Tab Handling ---
function openTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// --- Minter Tab Elements ---
const loadFileBtn = document.getElementById('loadFileBtn');
const mintBtn = document.getElementById('mintBtn');
const privateKeyInput = document.getElementById('privateKeyInput');
const detailsDiv = document.getElementById('details');
const statusDiv = document.getElementById('status');

// --- Verifier Tab Elements ---
const loadVerifyFileBtn = document.getElementById('loadVerifyFileBtn');
const tokenIdInput = document.getElementById('tokenIdInput');
const verifyBtn = document.getElementById('verifyBtn');
const verifyStatus = document.getElementById('verifyStatus');

// --- Minter Helper Functions ---
function updateStatus(message, isError = false) { statusDiv.innerHTML = `<p>${message}</p>`; statusDiv.style.color = isError ? 'red' : 'black'; }
function updateDetails(data) {
    if (data && data.device) { // Check that data and the nested 'device' object exist
        detailsDiv.innerHTML = `
            <p><strong>Status:</strong> File Loaded</p>
            <p><strong>Serial:</strong> ${data.device.serial_number}</p>
            <p><strong>Model:</strong> ${data.device.model}</p>
        `;
        mintBtn.disabled = false;
    } else {
        detailsDiv.innerHTML = `<p><strong>Status:</strong> Waiting for file...</p>`;
        mintBtn.disabled = true;
    }
}
// --- Verifier Helper Function ---
function updateVerifyStatus(message, isError = false) { verifyStatus.innerHTML = `<p>${message}</p>`; verifyStatus.style.color = isError ? 'red' : 'black'; }

// --- Minter Event Listeners ---
loadFileBtn.addEventListener('click', async () => {
    wipeData = await window.electronAPI.openFile();
    updateDetails(wipeData);
    if (wipeData) {
        updateStatus("Wipe data loaded. Enter private key and mint.");
    } else {
        updateStatus("File selection canceled or file is invalid.", true);
    }
});

mintBtn.addEventListener('click', async () => {
    const privateKey = privateKeyInput.value.trim();
    if (!wipeData) { /*...*/ return; }
    if (privateKey.length < 64) { /*...*/ return; }

    updateStatus("Minting data to blockchain...");
    mintBtn.disabled = true;
    
    // Add the private key to the data object
    wipeData.privateKey = privateKey; 
    const result = await window.electronAPI.storeCertificate({ detailedData: wipeData, privateKey: privateKey });
    if (result.success) {
        updateStatus(`✅ Data stored successfully! Tx Hash: ${result.hash}`, false);
    } else {
        updateStatus(`Error: ${result.error}`, true);
    }
    mintBtn.disabled = false;
});

// --- Verifier Event Listeners ---
loadVerifyFileBtn.addEventListener('click', async () => {
    verifyWipeData = await window.electronAPI.openFile();
    if (verifyWipeData) {
        tokenIdInput.value = ""; 
        updateVerifyStatus("Wipe data file loaded. Enter Token ID and verify.");
        verifyBtn.disabled = false;
    } else {
        updateVerifyStatus("File selection canceled or file is invalid.", true);
        verifyBtn.disabled = true;
    }
});
// In renderer.js, replace the old verifyBtn event listener

const certIdInput = document.getElementById('certIdInput'); // Get the new input field
verifyBtn.addEventListener('click', async () => {
    if (!verifyWipeData) {
        updateVerifyStatus("Please load a wipe data .json file first.", true);
        return;
    }
    // Use the original 'tokenIdInput' variable to get the value
    const certificateId = tokenIdInput.value.trim();
    if (certificateId === "") {
        updateVerifyStatus("Please enter a Certificate ID.", true);
        return;
    }
    updateVerifyStatus("🔍 Verifying... Fetching record from the blockchain.");
    verifyBtn.disabled = true;
    const result = await window.electronAPI.getCertificate(certificateId);
    if (!result.success) {
        updateVerifyStatus(`❌ Error: ${result.error}`, true);
        verifyBtn.disabled = false;
        return;
    }
    const blockchainData = result.data;
    const localData = verifyWipeData;

    const isSerialMatch = blockchainData.serialNumber === localData.device.serial_number;
    const isModelMatch = blockchainData.model === localData.device.model;
    const isEndTimeMatch = blockchainData.endTime === localData.wipe_process.end_time;
    const isOperatorMatch = blockchainData.operator === localData.operator;

    if (isSerialMatch && isModelMatch && isEndTimeMatch && isOperatorMatch) {
        updateVerifyStatus(`✅ VERIFIED! The data in the local file is authentic and matches the blockchain record.`, false);
    } else {
        updateVerifyStatus(`❌ FORGERY DETECTED! The local file's data does not match the immutable record on the blockchain.`, true);
    }

    verifyBtn.disabled = false;
});