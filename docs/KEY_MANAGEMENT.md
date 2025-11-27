# Blockchain Key Management

## 1. Storage
- **Local**: `.env` (NEVER commit this).
- **Production**: HashiCorp Vault or AWS Secrets Manager.
- **Keys**: We use a dedicated "Deployer" key for contract deployment and a "Worker" key for the backend to sign transactions.

## 2. Rotation Policy
- **Frequency**: Rotate keys every 90 days or upon suspected compromise.
- **Process**:
    1. Generate new account.
    2. Transfer ownership of Smart Contract to new address (`transferOwnership`).
    3. Update Vault/Secrets Manager.
    4. Restart services.

## 3. Recovery
- **Seed Phrases**: Stored in physical cold storage (Safe deposit box).
- **Multi-sig**: For contract upgrades, use a Gnosis Safe (3-of-5) instead of a single private key.
