const { ethers } = require("ethers");
const { getSecret } = require("../../scripts/secrets_manager");

async function getSigner() {
    // 1. Fetch Private Key from Vault (Production)
    const privateKey = await getSecret("secret/data/blockchain/deployer_key", "value");

    if (!privateKey) {
        throw new Error("Private key not found in Vault!");
    }

    // 2. Create Wallet
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);

    return wallet;
}

// Example usage
// (async () => {
//   const signer = await getSigner();
//   console.log("Signer Address:", signer.address);
// })();

module.exports = { getSigner };
