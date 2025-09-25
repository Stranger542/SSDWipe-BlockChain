// server.js
const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
require('dotenv').config(); // To manage secret keys

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURATION from .env file ---
const PORT = process.env.PORT || 5001;
const RPC_URL = process.env.RPC_URL; // Your Infura/Sepolia RPC URL
const SERVER_WALLET_PRIVATE_KEY = process.env.SERVER_WALLET_PRIVATE_KEY; // The single, secure private key for your server
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS; // Your deployed contract address
// In server.js, replace the old ABI with this new one
const CONTRACT_ABI = [
  {
    "inputs": [ { "internalType": "address", "name": "initialOwner", "type": "address" } ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "serialNumber", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "certificateId", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "minter", "type": "address" }
    ],
    "name": "CertificateStored",
    "type": "event"
  },
  {
    "inputs": [ { "internalType": "string", "name": "_serialNumber", "type": "string" } ],
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
          { "internalType": "string", "name": "digitalSignature", "type": "string" },
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
          { "internalType": "string", "name": "digitalSignature", "type": "string" },
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

// --- BLOCKCHAIN SETUP ---
const provider = new ethers.JsonRpcProvider(RPC_URL);
const serverWallet = new ethers.Wallet(SERVER_WALLET_PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, serverWallet);

console.log(`✅ Server wallet loaded: ${serverWallet.address}`);

// --- API ENDPOINT ---
app.post('/mint-certificate', async (req, res) => {
    const { detailedData } = req.body;

    if (!detailedData) {
        return res.status(400).json({ success: false, error: "Missing wipe data." });
    }

    try {
        console.log(`Received mint request for ID: ${detailedData.certificate_id}`);
        
        // Prepare the data structure for the smart contract [cite: 4]
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
            digitalSignature: detailedData.audit.digital_signature,
            blockTimestamp: 0, // Will be set by the contract
            minter: "0x0000000000000000000000000000000000000000" // Will be set by the contract
        };

        // The server calls the contract using its own secure wallet
        const tx = await contract.storeCertificate(certificateData);
        await tx.wait();

        console.log(`Transaction successful! Hash: ${tx.hash}`);
        res.status(200).json({ success: true, hash: tx.hash });

    } catch (error) {
        console.error("Error during minting process:", error);
        res.status(500).json({ success: false, error: error.reason || "An internal server error occurred." });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});