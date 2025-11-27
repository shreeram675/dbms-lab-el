const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const DocumentRegistry = await hre.ethers.getContractFactory("DocumentRegistry");
    const registry = await DocumentRegistry.deploy();

    await registry.waitForDeployment();
    const address = await registry.getAddress();

    console.log(`DocumentRegistry deployed to ${address}`);

    // Output address to a file for other services to pick up
    const configPath = path.join(__dirname, "../../deployed_contract.json");
    fs.writeFileSync(configPath, JSON.stringify({ address, network: hre.network.name }, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
