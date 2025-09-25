// public/certificate-renderer.js - CORRECTED AND CLEANED UP

document.addEventListener('DOMContentLoaded', async () => {
    const verifyLink = document.getElementById('verify-link');

    // 1. Get the serial number and txHash from the URL
    const params = new URLSearchParams(window.location.search);
    const serialNumber = params.get('id');
    const txHash = params.get('hash');

    if (!serialNumber) {
        document.body.innerHTML = '<h1>Error: No Serial Number provided in URL.</h1>';
        return;
    }

    // 2. Call the main process to fetch data from the blockchain
    const result = await window.electronAPI.getCertificate(serialNumber);

    if (result.success) {
        // 3. Populate the certificate fields with the fetched data
        const data = result.data;
        
        // --- Populate ONLY the fields that exist in the HTML ---
        document.getElementById('cert-model').textContent = data.model;
        document.getElementById('cert-serial').textContent = data.serialNumber;
        document.getElementById('cert-wipe-method').textContent = data.wipeMethod;
        document.getElementById('cert-verification').textContent = data.verificationStatus;
        document.getElementById('cert-start-time').textContent = data.startTime;
        document.getElementById('cert-end-time').textContent = data.endTime;
        
        const capacityInGB = (data.capacityBytes / (1000 ** 3)).toFixed(1);
        document.getElementById('cert-capacity').textContent = `${capacityInGB} GB`;
        
        const durationInMinutes = (data.durationSeconds / 60).toFixed(1);
        document.getElementById('cert-duration').textContent = `${durationInMinutes} minutes`;
        
        // 4. Update and show the verification link
        if (txHash) {
            verifyLink.href = `https://sepolia.etherscan.io/tx/${txHash}`;
        }

    } else {
        document.querySelector('.certificate-container').innerHTML = `<h1>Error</h1><p>${result.error}</p>`;
    }
});