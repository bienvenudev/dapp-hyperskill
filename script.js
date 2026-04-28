// Global smart contract instance (set after wallet connection)
let smartContract;

// Define the smart contract address
const contractAddress = "0x78343d5b366bfeB4010C2417fE28eF066F8ee49A";

// Define the smart contract ABI (Application Binary Interface)
const contractABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address",
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "newString",
        "type": "string",
      },
    ],
    "name": "StringSaved",
    "type": "event",
  },
  {
    "inputs": [],
    "name": "getString",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function",
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_string", "type": "string" },
    ],
    "name": "saveString",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function",
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "savedStrings",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function",
  },
];

// This function connects the website to MetaMask and identifies the user's account.
async function connect() {
  // Create a new provider instance using MetaMask and the "any" network
  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

  // Prompt users to connect their MetaMask account to the website
  await provider.send("eth_requestAccounts", []);

  // Get the signer, which represents the Ethereum account that will be used for sending transactions
  const signer = provider.getSigner();

  // Log the connected account address
  const address = await signer.getAddress();
  console.log("Connected account:", address);

  // Update the DOM with the connected account address
  document.getElementById("accountAddress").textContent =
    "Account Address: " + address;

  // Create a new instance of the smart contract using its address, ABI, and the signer
  smartContract = new ethers.Contract(contractAddress, contractABI, signer);
}

// This function calls the saveString function from the smart contract and uses the value from the input field as a parameter
async function saveString() {
  // Get the value from the input field
  const string = document.getElementById("input").value;

  // Log the action
  console.log(`Saving "${string}" to the blockchain...`);

  // Call the saveString function from the smart contract
  const txResponse = await smartContract.saveString(string);

  // Log the transaction hash
  console.log(`Transaction hash: ${txResponse.hash}`);

  // Construct the etherscan link
  const etherscanLink = `https://sepolia.etherscan.io/tx/${txResponse.hash}`;

  // Update the DOM with the transaction hash and make it clickable
  const transactionHashElement = document.getElementById("transactionHash");
  transactionHashElement.textContent = "Transaction Hash: " + txResponse.hash;
  transactionHashElement.href = etherscanLink;

  // Optionally, you can wait for the transaction to be confirmed and then log the receipt
  const txReceipt = await txResponse.wait();
  console.log(`Transaction was confirmed in block: ${txReceipt.blockNumber}`);
}

// This function retrieves a string from the smart contract using the getString function
async function getString() {
  // Call the getString function from the smart contract
  const string = await smartContract.getString();

  // Log and alert the retrieved string
  console.log(`Retrieved string from blockchain: "${string}"`);
  alert(`Your saved string is: ${string}`);
}

// Wire up button click events once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectButton").addEventListener("click", connect);
  document.getElementById("saveButton").addEventListener("click", saveString);
  document.getElementById("retrieveButton").addEventListener("click", getString);
});
