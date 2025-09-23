// --- LIBRARIES ---
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');
const CryptoJS = require('crypto-js');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const qrcode = require('qrcode');

// --- CONFIGURATION ---
// IMPORTANT: Use the addresses from your latest deployment
const certificateAddress = "0x9565e61d7f1444Dd8d237b875832F403a742946f";
const rpcUrl = "https://sepolia.infura.io/v3/21b3c6fcc4d64acab95cf11dbc713f83";

// ABI for the new SSDWipeStorage.sol contract
const certificateABI = [
  {
    "inputs": [ { "internalType": "address", "name": "initialOwner", "type": "address" } ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "certificateId", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "serialNumber", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "minter", "type": "address" }
    ],
    "name": "CertificateStored",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_certificateId",
        "type": "string"
      }
    ],
    "name": "getCertificateData",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "deviceType", "type": "string" },
          { "internalType": "string", "name": "model", "type": "string" },
          { "internalType": "string", "name": "serialNumber", "type": "string" },
          { "internalType": "uint64", "name": "capacityBytes", "type": "uint64" },
          { "internalType": "string", "name": "wipeMethod", "type": "string" },
          { "internalType": "string", "name": "startTime", "type": "string" },
          { "internalType": "string", "name": "endTime", "type": "string" },
          { "internalType": "uint32", "name": "durationSeconds", "type": "uint32" },
          { "internalType": "string", "name": "verificationStatus", "type": "string" },
          { "internalType": "string", "name": "operator", "type": "string" },
          { "internalType": "string", "name": "host", "type": "string" },
          { "internalType": "string", "name": "certificateId", "type": "string" },
          { "internalType": "uint256", "name": "blockTimestamp", "type": "uint256" },
          { "internalType": "address", "name": "minter", "type": "address" }
        ],
        "internalType": "struct SSDWipeStorage.WipeCertificateData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "internalType": "string", "name": "deviceType", "type": "string" },
          { "internalType": "string", "name": "model", "type": "string" },
          { "internalType": "string", "name": "serialNumber", "type": "string" },
          { "internalType": "uint64", "name": "capacityBytes", "type": "uint64" },
          { "internalType": "string", "name": "wipeMethod", "type": "string" },
          { "internalType": "string", "name": "startTime", "type": "string" },
          { "internalType": "string", "name": "endTime", "type": "string" },
          { "internalType": "uint32", "name": "durationSeconds", "type": "uint32" },
          { "internalType": "string", "name": "verificationStatus", "type": "string" },
          { "internalType": "string", "name": "operator", "type": "string" },
          { "internalType": "string", "name": "host", "type": "string" },
          { "internalType": "string", "name": "certificateId", "type": "string" },
          { "internalType": "uint256", "name": "blockTimestamp", "type": "uint256" },
          { "internalType": "address", "name": "minter", "type": "address" }
        ],
        "internalType": "struct SSDWipeStorage.WipeCertificateData",
        "name": "_data",
        "type": "tuple"
      }
    ],
    "name": "storeCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC HANDLERS ---
// Open JSON data file
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });
  if (!canceled && filePaths.length > 0) {
    try {
        const fileContent = fs.readFileSync(filePaths[0], 'utf-8');
        return JSON.parse(fileContent); // Return the full detailed data
    } catch (error) {
        console.error("Failed to read or parse JSON file:", error);
        return null;
    }
  }
  return null;
});

// Handler for the streamlined "Generate & Mint" workflow
ipcMain.handle('blockchain:store', async (event, args) => {
    const { detailedData, privateKey } = args; // detailedData is the parsed JSON from ssd1.json
    try {
        // 1. Create the data object that EXACTLY matches the contract's struct
       const certificateData = {
    deviceType: detailedData.device.device_type,
    model: detailedData.device.model,
    serialNumber: detailedData.device.serial_number,
    capacityBytes: detailedData.device.capacity_bytes,
    wipeMethod: detailedData.wipe_process.wipe_method,
    startTime: detailedData.wipe_process.start_time,
    endTime: detailedData.wipe_process.end_time,
    durationSeconds: detailedData.wipe_process.duration_seconds,
    verificationStatus: detailedData.verification.verification_status,
    operator: detailedData.operator,
    host: detailedData.host,
    certificateId: detailedData.certificate_id,
    blockTimestamp: 0, // Contract will overwrite this with block.timestamp
    minter: "0x0000000000000000000000000000000000000000" // Contract will overwrite this with msg.sender
};
        
        // 2. Set up the wallet and contract instance
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        // IMPORTANT: Use certificateAddress, not contractAddress
        const contract = new ethers.Contract(certificateAddress, certificateABI, wallet);

        // 3. Call the correct 'storeCertificate' function with the single data object
        const tx = await contract.storeCertificate(certificateData);
        await tx.wait();

        return { success: true, hash: tx.hash };
    } catch (error) {
        console.error("Error storing certificate:", error);
        return { success: false, error: error.reason || error.message };
    }
});
// Verify hash on blockchain
ipcMain.handle('blockchain:verify', async (event, tokenId) => {
    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const certificateContract = new ethers.Contract(certificateAddress, certificateABI, provider);
        const details = await certificateContract.wipeDetailsLog(tokenId);
        return { 
            success: true, 
            localCertificateHash: details.localCertificateHash
        };
    } catch (error) {
        console.error("Verification error:", error);
        return { success: false, error: error.reason || error.message };
    }
});

// Calculate hash of data
ipcMain.handle('tool:hash', (event, dataToHash) => {
    return '0x' + CryptoJS.SHA256(dataToHash).toString();
});

// Add this new handler to the end of main.js

ipcMain.handle('blockchain:getCertificate', async (event, certificateId) => {
    try {
        // For read-only operations, we only need a provider, not a signer/wallet
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(certificateAddress, certificateABI, provider);

        // Call the getCertificateData function from the smart contract
        const details = await contract.getCertificateData(certificateId);

        // The contract returns an array-like object. We'll convert it to a clean JS object.
        const result = {
            deviceType: details.deviceType,
            model: details.model,
            serialNumber: details.serialNumber,
            capacityBytes: Number(details.capacityBytes), // Convert BigInt to Number
            wipeMethod: details.wipeMethod,
            startTime: details.startTime,
            endTime: details.endTime,
            durationSeconds: Number(details.durationSeconds),
            verificationStatus: details.verificationStatus,
            operator: details.operator,
            host: details.host,
            certificateId: details.certificateId,
            blockTimestamp: Number(details.blockTimestamp),
            minter: details.minter
        };

        // Check if a record was actually found
        if (result.certificateId === "") {
             return { success: false, error: "Certificate ID not found on the blockchain." };
        }

        return { success: true, data: result };

    } catch (error) {
        console.error("Error retrieving certificate:", error);
        return { success: false, error: error.reason || error.message };
    }
});