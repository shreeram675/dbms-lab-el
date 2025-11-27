const vault = require('node-vault');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

async function getSecret(path, key, provider = 'vault') {
  if (provider === 'vault') {
    const client = vault({
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
      token: process.env.VAULT_TOKEN || 'root'
    });
    try {
      const result = await client.read(path);
      return result.data.data[key];
    } catch (e) {
      console.error(`Vault Error: ${e.message}`);
      return null;
    }
  } else if (provider === 'aws') {
    const client = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });
    try {
      const response = await client.send(
        new GetSecretValueCommand({ SecretId: path })
      );
      const secret = JSON.parse(response.SecretString);
      return secret[key];
    } catch (e) {
      console.error(`AWS Secrets Error: ${e.message}`);
      return null;
    }
  }
}

// Example Usage
// (async () => {
//   const dbPass = await getSecret('secret/data/db/password', 'value', 'vault');
//   console.log('DB Pass:', dbPass);
// })();

module.exports = { getSecret };
