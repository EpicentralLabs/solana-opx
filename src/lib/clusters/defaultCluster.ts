import { clusterApiUrl, Connection } from '@solana/web3.js'
import { Cluster, ClusterNetwork } from '@/types/solana/solanaClusters'
/**
 * Default Solana clusters configuration.
 *
 * This array contains the pre-configured cluster settings used by the application,
 * including the development (devnet), local, and test (testnet) clusters.
 *
 * @constant {Cluster[]}
 */
export const defaultClusters: Cluster[] = [
    {
      name: 'devnet',
      endpoint: clusterApiUrl('devnet'),
      network: ClusterNetwork.Devnet,
    },
    { 
      name: 'local', 
      endpoint: 'http://localhost:8899'
    },
    {
      name: 'testnet',
      endpoint: clusterApiUrl('testnet'),
      network: ClusterNetwork.Testnet,
    },
  ]