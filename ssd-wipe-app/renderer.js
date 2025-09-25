let wipeData = null;

// --- Elements for the Minter UI ---
const loadFileBtn = document.getElementById('loadFileBtn');
const mintBtn = document.getElementById('mintBtn');
const detailsDiv = document.getElementById('details');
const statusDiv = document.getElementById('status');

// --- Helper Functions ---
function updateStatus(message, isError = false, data = null) {
    statusDiv.style.color = isError ? '#ef4444' : '#22c55e'; // Using theme colors
    
    if (!isError && data && data.hash && data.id) { // CORRECTED: Expects data.id
        // Create a clickable link if the minting was successful
        statusDiv.innerHTML = `
            <p>✅ Data stored successfully! <a href="#" id="view-cert-link" style="color: var(--color-primary);">View Certificate</a></p>
            <p style="font-size: 0.8rem; color: var(--color-text-light);">Tx Hash: ${data.hash}</p>
        `;
        document.getElementById('view-cert-link').addEventListener('click', (e) => {
            e.preventDefault(); // Prevent the link from navigating
            window.electronAPI.openCertificateWindow({
                id: data.id, // CORRECTED: Passes data.id
                hash: data.hash
            });
        });
    } else {
        statusDiv.innerHTML = `<p>${message}</p>`;
    }
}

function updateDetails(data) {
    if (data && data.device) {
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

// --- Event Listeners ---
loadFileBtn.addEventListener('click', async () => {
    wipeData = await window.electronAPI.openFile();
    updateDetails(wipeData);
    if (wipeData) {
        updateStatus("Wipe data loaded. Ready to mint.");
    } else {
        updateStatus("File selection canceled or file is invalid.", true);
    }
});

mintBtn.addEventListener('click', async () => {
    if (!wipeData) {
        updateStatus("Please load a wipe data .json file first.", true);
        return;
    }
    
    updateStatus("Minting certificate to the blockchain...");
    mintBtn.disabled = true;
    
    // This calls the main process, which then calls the secure backend server.
    const result = await window.electronAPI.storeCertificate({ detailedData: wipeData });
    
    if (result.success) { // CORRECTED: Checks for result.success
        updateStatus("Success!", false, { 
            hash: result.hash, 
            id: wipeData.device.serial_number // CORRECTED: Passes 'id' property
        });
    } else {
        updateStatus(`Error: ${result.error}`, true);
    }
    
    mintBtn.disabled = false;
});