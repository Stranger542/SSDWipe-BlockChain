let wipeData = null;
let localCertHash = null;
let verifyFileData = null;

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
const generateBtn = document.getElementById('generateBtn');
const recommendationDiv = document.getElementById('recommendation');
const uploadCheckbox = document.getElementById('uploadCheckbox');
const blockchainSection = document.getElementById('blockchainSection');
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
    if (data) {
        detailsDiv.innerHTML = `<p><strong>Status:</strong> File Loaded</p><p><strong>Serial:</strong> ${data.ssdSerialNumber}</p><p><strong>Model:</strong> ${data.ssdModel}</p><p><strong>Recipient:</strong> ${data.recipient}</p>`;
        generateBtn.disabled = false;
        localCertHash = null;
    } else {
        detailsDiv.innerHTML = `<p><strong>Status:</strong> Waiting for file...</p>`;
        generateBtn.disabled = true;
    }
}

// --- Verifier Helper Function ---
function updateVerifyStatus(message, isError = false) { verifyStatus.innerHTML = `<p>${message}</p>`; verifyStatus.style.color = isError ? 'red' : 'black'; }

// --- Minter Event Listeners ---
loadFileBtn.addEventListener('click', async () => {
    wipeData = await window.electronAPI.openFile();
    updateDetails(wipeData);
    recommendationDiv.classList.add('hidden'); // Hide recommendation on new file load
    if (wipeData) {
        updateStatus("Wipe data loaded. Ready to generate local certificate.");
    } else {
        updateStatus("File selection canceled or file is invalid.", true);
    }
});

generateBtn.addEventListener('click', async () => {
    if (!wipeData) return;
    const certificateText = `--- SSD Wipe Certificate of Authenticity ---\nDate: ${new Date().toUTCString()}\n\nSerial Number: ${wipeData.ssdSerialNumber}\nModel: ${wipeData.ssdModel}\nWipe Method: ${wipeData.wipeMethod}\nWipe Completed Timestamp: ${new Date(wipeData.timestamp * 1000).toUTCString()}\n-------------------------------------------\nVerified via SSD Wipe Certificate Tool`;
    
    localCertHash = await window.electronAPI.calculateHash(certificateText);
    console.log("Generated Certificate Hash:", localCertHash);

    const result = await window.electronAPI.saveCertificate(certificateText);
    if (result.success) {
        updateStatus(`Local certificate saved to: ${result.path}`);
        recommendationDiv.classList.remove('hidden'); // Show recommendation
    } else if (result.error !== 'Save dialog canceled.') {
        updateStatus(`Error saving file: ${result.error}`, true);
    }
});

uploadCheckbox.addEventListener('change', () => {
    blockchainSection.classList.toggle('hidden', !uploadCheckbox.checked);
});

// In renderer.js, replace the existing mintBtn event listener
mintBtn.addEventListener('click', async () => {
    const privateKey = privateKeyInput.value.trim();
    if (!wipeData || !localCertHash) {
        updateStatus("Please generate and save the local certificate first.", true);
        return;
    }
    if (privateKey.length !== 64 && privateKey.length !== 66) { 
        updateStatus("Invalid private key format. It must be 64 or 66 characters long.", true); 
        return; 
    }
    updateStatus("Sending data to main process for minting...");
    mintBtn.disabled = true;
    
    const result = await window.electronAPI.mintCertificate({ wipeData, privateKey, localCertificateHash: localCertHash });
    
    if (result.success) {
        // --- MODIFIED: Display the new information ---
        updateStatus(
            `✅ Certificate minted successfully!<br>
             Tx Hash: ${result.hash}<br>
             Token ID: ${result.tokenId}<br>
             Verification Hash: ${result.verificationHash}`, 
            false
        );
    } else {
        updateStatus(`Error: ${result.error}`, true);
    }
    mintBtn.disabled = false;
});

// --- Verifier Event Listeners ---
loadVerifyFileBtn.addEventListener('click', async () => {
    const fileContent = await window.electronAPI.openFileRawText();
    if (fileContent !== null) {
        verifyFileData = fileContent;
        updateVerifyStatus("Certificate .txt file loaded. Enter Token ID and verify.");
        verifyBtn.disabled = false;
    } else {
        updateVerifyStatus("File selection canceled.", true);
        verifyBtn.disabled = true;
    }
});

verifyBtn.addEventListener('click', async () => {
    if (!verifyFileData) {
        updateVerifyStatus("Please load a certificate .txt file first.", true);
        return;
    }
    const tokenId = tokenIdInput.value;
    if (tokenId === "") {
        updateVerifyStatus("Please enter a Token ID.", true);
        return;
    }
    updateVerifyStatus("Verifying...");
    verifyBtn.disabled = true;

    const recalculatedHash = await window.electronAPI.calculateHash(verifyFileData);
    
    const blockchainResult = await window.electronAPI.verifyCertificate(tokenId);
    
    if (!blockchainResult.success) {
        updateVerifyStatus(`Error fetching from blockchain: ${blockchainResult.error}`, true);
        verifyBtn.disabled = false;
        return;
    }
    
    const originalHash = blockchainResult.localCertificateHash;

    if (recalculatedHash === originalHash) {
        updateVerifyStatus(`✅ VERIFIED! The file is authentic. Hash: ${originalHash}`, false);
    } else {
        updateVerifyStatus(`❌ FORGERY DETECTED! File hash does not match the blockchain record.`, true);
    }
    verifyBtn.disabled = false;
});