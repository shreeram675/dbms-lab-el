# Vault Setup for Local Development

## 1. Start Vault
Vault is included in the `docker-compose.yml`. It starts in dev mode with root token `root`.

## 2. Initialize & Unseal (Production only)
In production, Vault must be initialized and unsealed.
```bash
export VAULT_ADDR='http://127.0.0.1:8200'
vault operator init
# Save the Unseal Keys and Root Token!
vault operator unseal <Key 1>
vault operator unseal <Key 2>
vault operator unseal <Key 3>
```

## 3. Enable KV Secrets Engine
```bash
vault secrets enable -path=secret kv-v2
```

## 4. Store Secrets
```bash
# Database Password
vault kv put secret/db/password value="super_secure_password"

# Blockchain Key
vault kv put secret/blockchain/deployer_key value="0x..."
```

## 5. Access Policy
Create a policy `app-policy.hcl`:
```hcl
path "secret/data/db/*" {
  capabilities = ["read"]
}
path "secret/data/blockchain/*" {
  capabilities = ["read"]
}
```
Apply it:
```bash
vault policy write app-policy app-policy.hcl
```
