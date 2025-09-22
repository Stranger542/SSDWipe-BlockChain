const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');
const CryptoJS = require('crypto-js'); // Added for hashing

// --- CONFIGURATION ---
// IMPORTANT: Use the addresses from your latest deployment
const certificateAddress = "0x7fE1B88A7a02bd98C7748D37F9427C892f3c6413";
const rpcUrl = "https://sepolia.infura.io/v3/21b3c6fcc4d64acab95cf11dbc713f83";
// ABI for the final version of the smart contract
const certificateABI = [ { "inputs": [ { "internalType": "address", "name": "_registryAddress", "type": "address" }, { "internalType": "address", "name": "initialOwner", "type": "address" } ], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [ { "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "address", "name": "owner", "type": "address" } ], "name": "ERC721IncorrectOwner", "type": "error" }, { "inputs": [ { "internalType": "address", "name": "operator", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "ERC721InsufficientApproval", "type": "error" }, { "inputs": [ { "internalType": "address", "name": "approver", "type": "address" } ], "name": "ERC721InvalidApprover", "type": "error" }, { "inputs": [ { "internalType": "address", "name": "operator", "type": "address" } ], "name": "ERC721InvalidOperator", "type": "error" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" } ], "name": "ERC721InvalidOwner", "type": "error" }, { "inputs": [ { "internalType": "address", "name": "receiver", "type": "address" } ], "name": "ERC721InvalidReceiver", "type": "error" }, { "inputs": [ { "internalType": "address", "name": "sender", "type": "address" } ], "name": "ERC721InvalidSender", "type": "error" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "ERC721NonexistentToken", "type": "error" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" } ], "name": "OwnableInvalidOwner", "type": "error" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "OwnableUnauthorizedAccount", "type": "error" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "approved", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "operator", "type": "address" }, { "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" } ], "name": "ApprovalForAll", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "operator", "type": "address" }, { "indexed": false, "internalType": "string", "name": "ssdSerialNumber", "type": "string" } ], "name": "CertificateMinted", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "owner", "type": "address" } ], "name": "CertificateRevoked", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "approve", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "getApproved", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "operator", "type": "address" } ], "name": "isApprovedForAll", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "string", "name": "ssdSerialNumber", "type": "string" }, { "internalType": "string", "name": "ssdModel", "type": "string" }, { "internalType": "string", "name": "wipeMethod", "type": "string" }, { "internalType": "uint256", "name": "timestamp", "type": "uint256" }, { "internalType": "string", "name": "_tokenURI", "type": "string" }, { "internalType": "bytes32", "name": "localCertificateHash", "type": "bytes32" } ], "name": "mintCertificate", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "operatorRegistry", "outputs": [ { "internalType": "contract OperatorRegistry", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "ownerOf", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "revokeCertificate", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "bytes", "name": "data", "type": "bytes" } ], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "operator", "type": "address" }, { "internalType": "bool", "name": "approved", "type": "bool" } ], "name": "setApprovalForAll", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" } ], "name": "supportsInterface", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "string", "name": "", "type": "string" } ], "name": "tokenIdBySerial", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "tokenURI", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "transferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "wipeDetailsLog", "outputs": [ { "internalType": "string", "name": "ssdSerialNumber", "type": "string" }, { "internalType": "string", "name": "ssdModel", "type": "string" }, { "internalType": "string", "name": "wipeMethod", "type": "string" }, { "internalType": "uint256", "name": "timestamp", "type": "uint256" }, { "internalType": "address", "name": "operator", "type": "address" }, { "internalType": "bytes32", "name": "verificationHash", "type": "bytes32" }, { "internalType": "bytes32", "name": "localCertificateHash", "type": "bytes32" } ], "stateMutability": "view", "type": "function" } ];
// ------------------------------------

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

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Handler for opening a JSON file (for Minter)
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });
  if (!canceled && filePaths.length > 0) {
    try {
        const data = fs.readFileSync(filePaths[0], 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Failed to read or parse JSON file:", error);
        return null;
    }
  }
  return null;
});

// Handler for opening a raw text (.txt) file (for Verifier)
ipcMain.handle('dialog:openFileRawText', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select Certificate File to Verify',
      filters: [{ name: 'Text Files', extensions: ['txt'] }]
  });
  if (!canceled && filePaths.length > 0) {
      try {
          return fs.readFileSync(filePaths[0], 'utf-8');
      } catch (error) {
          console.error("Failed to read text file:", error);
          return null;
      }
  }
  return null;
});

// Handler for saving the certificate file
ipcMain.handle('dialog:saveFile', async (event, certificateText) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save SSD Wipe Certificate',
    defaultPath: `ssd-wipe-certificate.txt`,
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  });
  if (!canceled && filePath) {
    try {
      fs.writeFileSync(filePath, certificateText, 'utf-8');
      return { success: true, path: filePath };
    } catch (error) {
      console.error('Failed to save the file:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Save dialog canceled.' };
});

// In main.js, replace the existing 'blockchain:mint' handler
ipcMain.handle('blockchain:mint', async (event, args) => {
    const { wipeData, privateKey, localCertificateHash } = args;
    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const certificateContract = new ethers.Contract(certificateAddress, certificateABI, wallet);

        const tx = await certificateContract.mintCertificate(
            ethers.getAddress(wipeData.recipient),
            wipeData.ssdSerialNumber,
            wipeData.ssdModel,
            wipeData.wipeMethod,
            wipeData.timestamp,
            wipeData.tokenURI,
            localCertificateHash
        );

        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        // --- NEW: Find the event and extract the Token ID ---
        const eventLog = receipt.logs.find(log => {
            try {
                const parsedLog = certificateContract.interface.parseLog(log);
                return parsedLog && parsedLog.name === 'CertificateMinted';
            } catch (error) {
                return false;
            }
        });

        if (!eventLog) {
            throw new Error("CertificateMinted event not found in transaction receipt.");
        }
        
        const parsedLog = certificateContract.interface.parseLog(eventLog);
        const tokenId = Number(parsedLog.args.tokenId); // Convert BigInt to number

        // --- NEW: Fetch the details using the new Token ID ---
        const details = await certificateContract.wipeDetailsLog(tokenId);
        
        return { 
            success: true, 
            hash: tx.hash,
            tokenId: tokenId, // Add tokenId to the result
            verificationHash: details.verificationHash // Add verificationHash to the result
        };
        
    } catch (error) {
        console.error(error);
        return { success: false, error: error.reason || error.message };
    }
});
// Handler for fetching hash from the blockchain
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

// NEW: Handler for calculating the hash
ipcMain.handle('tool:hash', (event, dataToHash) => {
    return '0x' + CryptoJS.SHA256(dataToHash).toString();
});