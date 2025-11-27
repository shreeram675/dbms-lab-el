const { ethers } = require("ethers");
const fs = require("fs");

async function startWorker() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://localhost:8545");

    // Load Contract ABI/Address
    const contractData = JSON.parse(fs.readFileSync("./deployed_contract.json", "utf8"));
    const abi = ["event HashStored(string indexed docId, string hash, address indexed owner, uint256 timestamp)"];
    const contract = new ethers.Contract(contractData.address, abi, provider);

    console.log("🎧 Listening for HashStored events...");

    contract.on("HashStored", (docId, hash, owner, timestamp) => {
        console.log(`📝 Event Received: DocID=${docId}, Hash=${hash}`);
        // TODO: Update database status to 'Confirmed'
    });
}

startWorker();
