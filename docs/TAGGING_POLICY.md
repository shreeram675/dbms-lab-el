# Tagging Policy

We use the following tags for our Docker images:

1. **`latest`**: Points to the most recent build on the `main` branch. NOT for production.
2. **`staging`**: Points to the version currently deployed in staging.
3. **`vX.Y.Z`**: Semantic version tags for production releases.
4. **`sha-<short-hash>`**: Immutable tag for every commit, useful for debugging specific builds.

## Workflow
- **CI**: Builds `sha-<short-hash>` and `latest` on every push to main.
- **Release**: When a tag `v*` is pushed, it builds `vX.Y.Z`.
