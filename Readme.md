# SSD Wipe Certification on Blockchain (v2)

This project provides a **secure, user-friendly system** for generating a verifiable authenticity certificate for securely wiping Solid State Drives (SSDs). It uses a dedicated backend server to interact with a public blockchain, creating a trusted and immutable record of data destruction while abstracting all complexity from the end-user.

---

## 🔑 Key Features

- **Secure Backend Architecture:**  
  A standalone Node.js server manages all blockchain interactions. The private key is kept completely isolated and secure—**no need for the end-user to handle wallets or cryptocurrency**.

- **Simple, Keyless Operation:**  
  The operator uses the Electron desktop app to load a wipe data file and click a single button to mint the certificate.  
  _No MetaMask, private keys, or browser extensions required._

- **On-Chain Data Verification:**  
  All certificate data is stored immutably on the blockchain. The system can instantly fetch and verify this data against a local file to detect any signs of tampering.

- **Professional Certificate Viewer:**  
  On successful minting, the application generates a clean, human-readable certificate page that displays the verified on-chain data, complete with a link to Etherscan for auditing.

---

## 🏗️ System Architecture

The system is composed of three distinct components:

1. **Smart Contract (`SSDWipeStorage.sol`):**  
   The definitive source of truth. This Solidity contract is deployed on the blockchain and acts as the immutable database for all wipe certificates.

2. **Backend Server (`server.js`):**  
   The secure middleman. This Node.js/Express server is the only component that holds a private key. It exposes a simple API for the desktop app and handles all transaction signing and gas fee payments.

3. **Desktop App (`ssd-wipe-app`):**  
   The user-facing client. An Electron application used by an operator to load wipe reports and submit them for certification by calling the backend server's API.

---

## ⚙️ Full Setup Instructions

### **Part 1: Smart Contract Deployment**

_This part is for the developer setting up the on-chain component._

#### **Prerequisites**
- [Node.js and npm](https://nodejs.org/)
- [MetaMask browser extension](https://metamask.io/)

#### **Get Test ETH**
- In MetaMask, switch your network to the **Sepolia testnet**.
- Use a public faucet (e.g., [sepoliafaucet.com](https://sepoliafaucet.com/)) to get free test ETH for the wallet you will use for deployment.

#### **Configure and Deploy**
1. Navigate to your smart contract project directory.
2. Create a `.env` file and add your credentials:
    ```
    SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY"
    PRIVATE_KEY="YOUR_METAMASK_PRIVATE_KEY_FOR_DEPLOYMENT"
    ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"
    ```
3. Install dependencies and run the deployment script:
    ```bash
    npm install
    npx hardhat run scripts/deploy.js --network sepolia
    ```
4. **IMPORTANT:**  
   After a successful deployment, **copy the deployed contract address**. You will need it in the next step.

---

### **Part 2: Backend Server Setup**

_This is the secure middleman that will handle all transactions._

1. Navigate to your backend server's directory.
2. Install dependencies:
    ```bash
    npm install express ethers cors dotenv
    ```
3. Configure environment variables:  
   In the backend server's directory, create a new `.env` file:
    ```
    # .env file for the backend server

    # Your public Sepolia RPC URL from a provider like Infura or Alchemy
    RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY

    # The private key of the SERVER'S wallet. This wallet pays for all gas fees.
    SERVER_WALLET_PRIVATE_KEY=0x...

    # The contract address from Part 1
    CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
    ```
4. Run the backend server:
    ```bash
    node server.js
    ```
   Your server should now be running, typically on [http://localhost:5001](http://localhost:5001).  
   **Keep this terminal window open.**

---

### **Part 3: Desktop App Setup**

_This is the client application that the operator will use._

1. Navigate to your Electron app's directory (`ssd-wipe-app`).
2. Install dependencies:
    ```bash
    npm install axios
    # (And any other dependencies from your package.json)
    ```
3. **Configure the Endpoint:**  
   The Electron app no longer needs any private keys or contract addresses.  
   The only thing to check is that the API endpoint in `main.js` correctly points to your running backend server:
    ```js
    // In main.js, inside the 'blockchain:store' handler
    const response = await axios.post('http://localhost:5001/mint-certificate', { ... });
    ```
4. Run the application:
    ```bash
    npm start
    ```
   The application window will launch, ready for use.

---

## 📝 Application Workflow

1. Click **"Load Wipe Data File"** and select a valid `.json` report.
2. The app will display the device's serial and model.
3. Click **"Mint Certificate to Blockchain"**. The app will send the data to the backend server.
4. The backend server signs and sends the transaction, paying the gas fee.
5. Upon success, the app displays a success message with a clickable **"View Certificate"** link.
6. Clicking the link opens a new, professional certificate window displaying the immutable data fetched from the blockchain.

---

**Need help?**  
Open an issue or check the comments in each component for troubleshooting tips!