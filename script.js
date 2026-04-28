// Global smart contract instance (set after wallet connection)
let smartContract;
let userAddress;

// Define the smart contract address
const contractAddress = "0x78343d5b366bfeB4010C2417fE28eF066F8ee49A";

// Sepolia testnet chain ID
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // hex for 11155111

// Define the smart contract ABI (Application Binary Interface)
const contractABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "newString",
        type: "string",
      },
    ],
    name: "StringSaved",
    type: "event",
  },
  {
    inputs: [],
    name: "getString",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_string", type: "string" }],
    name: "saveString",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "savedStrings",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

// This function connects the website to MetaMask and identifies the user's account.
async function connect() {
  // Create a new provider instance using MetaMask and the "any" network
  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

  // Prompt users to connect their MetaMask account to the website
  await provider.send("eth_requestAccounts", []);

  // Ensure the user is on the Sepolia testnet; prompt a switch if not
  const { chainId } = await provider.getNetwork();
  if (chainId !== 11155111) {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  }

  // Get the signer, which represents the Ethereum account that will be used for sending transactions
  const signer = provider.getSigner();

  // Store and display the connected account address
  userAddress = await signer.getAddress();
  console.log("Connected account:", userAddress);
  document.getElementById("accountAddress").textContent =
    "Account Address: " + userAddress;

  // Create a new instance of the smart contract using its address, ABI, and the signer
  smartContract = new ethers.Contract(contractAddress, contractABI, signer);
}

// This function calls the saveString function from the smart contract and uses the value from the input field as a parameter
async function saveString() {
  if (!smartContract) {
    alert("Please connect your MetaMask wallet first.");
    return;
  }

  // Get the value from the input field
  const string = document.getElementById("input").value;
  if (!string.trim()) {
    alert("Please enter a string before saving.");
    return;
  }

  console.log(`Saving "${string}" to the blockchain...`);

  // Call the saveString function from the smart contract
  const txResponse = await smartContract.saveString(string);
  console.log(`Transaction hash: ${txResponse.hash}`);

  // Construct the Etherscan link and display it
  const etherscanLink = `https://sepolia.etherscan.io/tx/${txResponse.hash}`;
  const transactionHashElement = document.getElementById("transactionHash");
  transactionHashElement.textContent = "Transaction Hash: " + txResponse.hash;
  transactionHashElement.href = etherscanLink;

  // Wait for the transaction to be confirmed
  const txReceipt = await txResponse.wait();
  console.log(`Transaction confirmed in block: ${txReceipt.blockNumber}`);
}

// This function retrieves the most recent string saved by the connected wallet
async function getString() {
  if (!smartContract) {
    alert("Please connect your MetaMask wallet first.");
    return;
  }

  const string = await smartContract.getString();
  console.log(`Retrieved string from blockchain: "${string}"`);
  alert(`Your saved string is: ${string}`);
}

// This function fetches all StringSaved events for the connected wallet and renders them as a list
async function getHistory() {
  if (!smartContract) {
    alert("Please connect your MetaMask wallet first.");
    return;
  }

  const txHistory = document.getElementById("transactionHistory");

  // Clear previous results before re-rendering
  txHistory.innerHTML = "";

  // Query all past StringSaved events emitted by this wallet address
  const filter = smartContract.filters.StringSaved(userAddress);
  const events = await smartContract.queryFilter(filter);

  if (events.length === 0) {
    txHistory.innerHTML = "<li>No history found for this wallet.</li>";
    return;
  }

  for (const event of events) {
    const etherscanLink = `https://sepolia.etherscan.io/tx/${event.transactionHash}`;
    const liEl = document.createElement("li");
    liEl.innerHTML = `"${event.args.newString}" — <a href="${etherscanLink}" target="_blank" rel="noopener noreferrer">Block #${event.blockNumber}</a>`;
    txHistory.appendChild(liEl);
  }
}

// Wire up button click events once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectButton").addEventListener("click", connect);
  document.getElementById("saveButton").addEventListener("click", saveString);
  document.getElementById("retrieveButton").addEventListener("click", getString);
  document.getElementById("historyButton").addEventListener("click", getHistory);
});
