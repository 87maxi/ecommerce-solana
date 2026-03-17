import { create } from 'kubo-rpc-client';
import { Buffer } from 'buffer';

const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'http://localhost:8080/ipfs/';
const ipfsApiUrl = process.env.NEXT_PUBLIC_IPFS_API_URL || 'http://127.0.0.1:5001';

// Initialize the IPFS client
const ipfs = create({ url: ipfsApiUrl });

/**
 * Uploads a file buffer to the local IPFS node.
 * @param {Buffer} fileBuffer The file content as a Buffer.
 * @returns {Promise<string>} The IPFS CID (hash) of the uploaded file.
 */
export async function uploadToIPFS(fileBuffer: Buffer): Promise<string> {
  try {
    const { cid } = await ipfs.add(fileBuffer);
    console.log(`[IPFS] File uploaded successfully. CID: ${cid.toString()}`);
    return cid.toString();
  } catch (error) {
    console.error('[IPFS] Error uploading file to local node:', error);
    throw new Error('Could not connect to the local IPFS daemon. Is Kubo running?');
  }
}

/**
 * Generates a public URL for an IPFS CID using the local gateway.
 * @param {string} cid The IPFS CID.
 * @returns {string} The public URL to view the file.
 */
export function getIPFSUrl(cid: string): string {
  return `${ipfsGateway}${cid}`;
}

/**
 * Verifies the connection to the local IPFS node.
 * @returns {Promise<boolean>} True if the connection is successful.
 */
export async function testIPFSConnection(): Promise<boolean> {
  try {
    const id = await ipfs.id();
    console.log('[IPFS] Connection successful. Node ID:', id.id);
    return true;
  } catch (error) {
    console.error('[IPFS] Failed to connect to local node:', error);
    return false;
  }
}
