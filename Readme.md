# SSD Wipe Certification on Blockchain

This project provides a complete end-to-end system for generating a verifiable authenticity certificate for securely wiping Solid State Drives (SSDs) on a public blockchain. It combines a secure wiping environment with the immutability of blockchain technology to create a trusted, auditable record of data destruction.

---

## 🚀 Highlights

- **Local Certificate Generation:**  
  Create a human-readable `.txt` certificate of the wipe event that can be saved locally.

- **Optional Blockchain Minting:**  
  Mint the certificate as an ERC-721 (NFT) token on the blockchain for a permanent, immutable record.

- **Hash-Based Verification:**  
  The application generates a SHA-256 hash of the local certificate, which is stored on-chain. Anyone can cryptographically verify that a local certificate file is authentic and untampered.

- **Secure Architecture:**  
  The desktop app uses a secure Electron architecture (Main, Preload, and Renderer processes) to keep sensitive operations and private keys isolated from the user interface.

---

## 🏗️ Project Structure

- **Smart Contracts (`ssd-contracts-v2`):**  
  On-chain logic for minting and managing NFT-based certificates.

- **Desktop Application (`ssd-wipe-app`):**  
  Electron.js application for operators to generate and manage certificates.

---

## 1️⃣ Smart Contracts Setup (`ssd-contracts-v2`)

### Prerequisites

- **Node.js:**  
  [Download from nodejs.org](https://nodejs.org/)
- **Code Editor:**  
  Recommended: VS Code
- **MetaMask:**  
  [Install from metamask.io](https://metamask.io/)

---

### Step 1: Set Up Your Wallet & Get Test ETH

1. **Install MetaMask:**  
   Add the MetaMask extension to your browser and create a new wallet.  
   > ⚠️ **Securely back up your Secret Recovery Phrase.**

2. **Switch to Testnet:**  
   In MetaMask, select the **"Sepolia"** test network.

3. **Get Free Test ETH:**  
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Google Cloud Sepolia Faucet](https://cloud.google.com/blockchain-node-engine/docs/ethereum/sepolia-faucet) (requires Google Cloud account)

---

### Step 2: Set Up the Hardhat Project

```bash
cd ssd-contracts-v2
npm install
```

---

### Step 3: Configure Environment Variables

1. **Create `.env` in `ssd-contracts-v2` directory.**
2. **Add your credentials:**

    ```
    # Get this from a node provider like Infura or Alchemy
    SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY"

    # Export this from your MetaMask account (see "Account details")
    PRIVATE_KEY="YOUR_METAMASK_PRIVATE_KEY"

    # Create a free account on etherscan.io to get this
    ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"
    ```

---

### Step 4: Deploy the Smart Contracts

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

> After deployment, **save the addresses** of your deployed contracts for use in the desktop app.

---

## 2️⃣ Desktop Application Setup (`ssd-wipe-app`)

### Prerequisites

- **Node.js** (already installed above)

---

### Step 1: Install Dependencies

```bash
cd ssd-wipe-app
npm install
```

---

### Step 2: Configure the Application

- Open `main.js` in a code editor.
- Find the **CONFIGURATION** section at the top.
- Replace the placeholder values:

    ```javascript
    // In main.js
    const certificateAddress = "YOUR_DEPLOYED_CERTIFICATE_ADDRESS"; // From contract deployment
    const rpcUrl = "https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY"; // Your Infura URL
    ```

- Ensure `certificateABI` in `main.js` matches your latest compiled contract.

---

### Step 3: Run the Application

```bash
npm start
```

> The application window will launch, and you can begin testing the full workflow.

---

## 💡 Comments & Tips

- **Backup your wallet credentials and environment variables securely.**
- **Always test on Sepolia (testnet) before deploying to mainnet.**
- **Keep your contract addresses and ABI up-to-date in the desktop app.**
- **For troubleshooting, check the terminal output and logs in Electron.**

---

## 📚 Resources

- [Node.js](https://nodejs.org/)
- [MetaMask](https://metamask.io/)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Hardhat Documentation](https://hardhat.org/getting-started/)