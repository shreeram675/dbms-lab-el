# Tracing Setup (OpenTelemetry)

1. **Install SDK**: `npm install @opentelemetry/sdk-node`
2. **Initialize**:
   ```javascript
   const { NodeSDK } = require('@opentelemetry/sdk-node');
   const sdk = new NodeSDK({ ... });
   sdk.start();
   ```
3. **Visualize**: Use Jaeger or Zipkin to view traces.
