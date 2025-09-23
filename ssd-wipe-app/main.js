// main.js - MODIFIED FOR BACKEND INTEGRATION

// --- LIBRARIES ---
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers'); // Still needed for read-only operations (verifier)
const axios = require('axios'); // Used to communicate with the backend server

// --- CONFIGURATION ---
// This information is now only used for the READ-ONLY verifier function.
// The backend server will have its own separate configuration.
const certificateAddress = "0x9565e61d7f1444Dd8d237b875832F403a742946f";
const rpcUrl = "https://sepolia.infura.io/v3/21b3c6fcc4d64acab95cf11dbc713f83";
const certificateABI = [
  {
    "inputs": [ { "internalType": "address", "name": "initialOwner", "type": "address" } ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "string", "name": "certificateId", "type": "string" }, { "indexed": false, "internalType": "string", "name": "serialNumber", "type": "string" }, { "indexed": true, "internalType": "address", "name": "minter", "type": "address" } ], "name": "CertificateStored", "type": "event" },
  { "inputs": [ { "internalType": "string", "name": "_certificateId", "type": "string" } ], "name": "getCertificateData", "outputs": [ { "components": [ { "internalType": "string", "name": "deviceType", "type": "string" }, { "internalType": "string", "name": "model", "type": "string" }, { "internalType": "string", "name": "serialNumber", "type": "string" }, { "internalType": "uint64", "name": "capacityBytes", "type": "uint64" }, { "internalType": "string", "name": "wipeMethod", "type": "string" }, { "internalType": "string", "name": "startTime", "type": "string" }, { "internalType": "string", "name": "endTime", "type": "string" }, { "internalType": "uint32", "name": "durationSeconds", "type": "uint32" }, { "internalType": "string", "name": "verificationStatus", "type": "string" }, { "internalType": "string", "name": "operator", "type": "string" }, { "internalType": "string", "name": "host", "type": "string" }, { "internalType": "string", "name": "certificateId", "type": "string" }, { "internalType": "uint256", "name": "blockTimestamp", "type": "uint256" }, { "internalType": "address", "name": "minter", "type": "address" } ], "internalType": "struct SSDWipeStorage.WipeCertificateData", "name": "", "type": "tuple" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "components": [ { "internalType": "string", "name": "deviceType", "type": "string" }, { "internalType": "string", "name": "model", "type": "string" }, { "internalType": "string", "name": "serialNumber", "type": "string" }, { "internalType": "uint64", "name": "capacityBytes", "type": "uint64" }, { "internalType": "string", "name": "wipeMethod", "type": "string" }, { "internalType": "string", "name": "startTime", "type": "string" }, { "internalType": "string", "name": "endTime", "type": "string" }, { "internalType": "uint32", "name": "durationSeconds", "type": "uint32" }, { "internalType": "string", "name": "verificationStatus", "type": "string" }, { "internalType": "string", "name": "operator", "type": "string" }, { "internalType": "string", "name": "host", "type": "string" }, { "internalType": "string", "name": "certificateId", "type": "string" }, { "internalType": "uint256", "name": "blockTimestamp", "type": "uint256" }, { "internalType": "address", "name": "minter", "type": "address" } ], "internalType": "struct SSDWipeStorage.WipeCertificateData", "name": "_data", "type": "tuple" } ], "name": "storeCertificate", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
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

// Open JSON data file (NO CHANGE)
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });
  if (!canceled && filePaths.length > 0) {
    try {
        const fileContent = fs.readFileSync(filePaths[0], 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error("Failed to read or parse JSON file:", error);
        return null;
    }
  }
  return null;
});


// --- MODIFIED ---
// This handler now calls the backend server instead of the blockchain directly.
ipcMain.handle('blockchain:store', async (event, args) => {
    const { detailedData } = args; // Note: 'privateKey' is no longer received from the frontend

    try {
        console.log("Sending mint request to backend server...");
        // The Electron app makes a standard web request to your backend
        const response = await axios.post('http://localhost:5001/mint-certificate', {
            detailedData: detailedData
        });
        
        // Return the success or failure message from the server to the frontend
        return response.data;

    } catch (error) {
        console.error("Error calling backend service:", error.response ? error.response.data : error.message);
        
        // Create a structured error message for the frontend
        const errorMessage = error.response 
            ? error.response.data.error 
            : "Could not connect to the backend service. Is it running?";
            
        return { success: false, error: errorMessage };
    }
});


// --- UNCHANGED ---
// This handler for the verifier tab can remain as it is a read-only operation
// and does not require a private key.
ipcMain.handle('blockchain:getCertificate', async (event, certificateId) => {
    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(certificateAddress, certificateABI, provider);

        const details = await contract.getCertificateData(certificateId);

        const result = {
            deviceType: details.deviceType,
            model: details.model,
            serialNumber: details.serialNumber,
            capacityBytes: Number(details.capacityBytes),
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

        if (result.certificateId === "") {
             return { success: false, error: "Certificate ID not found on the blockchain." };
        }

        return { success: true, data: result };

    } catch (error) {
        console.error("Error retrieving certificate:", error);
        return { success: false, error: error.reason || error.message };
    }
});

ipcMain.on('app:open-certificate-window', (event, args) => {
    const { id, hash } = args;

    const certWindow = new BrowserWindow({
        width: 800,
        height: 700,
        title: "Wipe Certificate",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // Load the certificate.html file and pass the ID and Hash as URL parameters
    certWindow.loadFile(path.join(__dirname, 'public/certificate.html'), {
        query: { id, hash }
    });
});