// public/certificate-renderer.js - CORRECTED

document.addEventListener('DOMContentLoaded', async () => {
    // The 'loader' element has been removed from the HTML, so we remove it from the script too.
    const certContent = document.getElementById('cert-content'); // This element doesn't exist in the new HTML, but we'll leave it for now to avoid more changes.
    const verifyLink = document.getElementById('verify-link');

    // 1. Get the certificate ID and txHash from the URL
    const params = new URLSearchParams(window.location.search);
    const certificateId = params.get('id');
    const txHash = params.get('hash');

    if (!certificateId) {
        // Since the loader is gone, we can't show a message there.
        // The page will just show the empty template.
        console.error('Error: No Certificate ID provided.');
        return;
    }

    // 2. Call the main process to fetch data from the blockchain
    const result = await window.electronAPI.getCertificate(certificateId);

    if (result.success) {
        // 3. Populate the certificate fields with the fetched data
        const data = result.data;
        document.getElementById('cert-id').textContent = data.certificateId;
        document.getElementById('cert-serial').textContent = data.serialNumber;
        document.getElementById('cert-model').textContent = data.model;
        document.getElementById('cert-wipe-method').textContent = data.wipeMethod;
        document.getElementById('cert-verification').textContent = data.verificationStatus;
        document.getElementById('cert-start-time').textContent = data.startTime;
        document.getElementById('cert-end-time').textContent = data.endTime;
        document.getElementById('cert-operator').textContent = data.operator;
        document.getElementById('cert-host').textContent = data.host; // Added this line to populate the host
        
        // Populate the new fields
        const capacityInGB = (data.capacityBytes / (1000 ** 3)).toFixed(1);
        document.getElementById('cert-capacity').textContent = `${capacityInGB} GB`;
        
        const durationInMinutes = (data.durationSeconds / 60).toFixed(1);
        document.getElementById('cert-duration').textContent = `${durationInMinutes} minutes`;
        
        // 4. Update and show the verification link
        if (txHash) {
            verifyLink.href = `https://sepolia.etherscan.io/tx/${txHash}`;
            verifyLink.style.display = 'inline-block';
        }

    } else {
        // Log the error to the console for debugging
        console.error(`Error fetching certificate: ${result.error}`);
        // Optionally, show an error message on the page
        document.querySelector('.certificate-container').innerHTML = `<h1>Error</h1><p>${result.error}</p>`;
    }
});