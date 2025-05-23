import { createSolanaClient } from "gill";
import { defaultClusters } from "@/solana/clusters/defaultCluster";
import { validateRpcConnection, validateEndpointFormat } from "@/solana/utils/validateRpcConnection";
import { clusterApiUrl } from "@solana/web3.js";

/**
 * Initialize the Solana client with the Triton RPC URL.
 * 
 * This function attempts to use the environment variable first, and if that fails,
 * it falls back to the predefined Triton endpoint from defaultClusters.
 * 
 * @returns {Object} Returns the Solana client with methods for RPC, subscriptions, and transactions.
 */
// Get the Triton endpoint from environment variable or defaultClusters
const tritonEndpoint = validateEndpointFormat(
  process.env.NEXT_PUBLIC_TRITON_RPC_URL || 
  defaultClusters.find(cluster => cluster.name === 'triton-devnet')?.endpoint || 
  'https://api.devnet.solana.com'
);

// Validate the endpoint in non-browser environments
if (typeof window === 'undefined') {
  // Server-side initialization
  validateRpcConnection(tritonEndpoint)
    .then(result => {
      if (!result.success) {
        console.warn(`Warning: RPC validation failed: ${result.message}`);
      }
    })
    .catch(err => {
      console.error("Failed to validate RPC connection:", err);
    });
}

// Create a Solana client with the endpoint
const { rpc, rpcSubscriptions, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: tritonEndpoint,
});

/**
 * Get current RPC connection details for display or debugging purposes
 * @returns Information about the current RPC connection
 */
export function getRpcConnectionDetails() {
  return {
    endpoint: tritonEndpoint,
    isDevnet: tritonEndpoint.includes('devnet') || tritonEndpoint.includes('devnet'),
    isLocal: tritonEndpoint.includes('localhost') || tritonEndpoint.includes('127.0.0.1'),
    isMainnet: tritonEndpoint.includes('mainnet'),
    isCustom: !(
      tritonEndpoint.includes('devnet') || 
      tritonEndpoint.includes('localhost') || 
      tritonEndpoint.includes('127.0.0.1') || 
      tritonEndpoint.includes('mainnet') || 
      tritonEndpoint.includes('custom')
    ),
  };
}

export { rpc, rpcSubscriptions, sendAndConfirmTransaction, createSolanaClient };
