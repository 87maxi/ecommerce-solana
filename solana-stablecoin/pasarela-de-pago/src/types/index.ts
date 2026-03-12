// Order interface
export interface Order {
  orderId: string;
  paymentIntentId?: string;
  productId?: string;
  quantity?: number;
  buyerAddress: string;
  totalAmount?: number;
  tokenAmount: number;
  invoice: string;
  status: 'pending' | 'completed' | 'expired' | 'failed';
  createdAt: Date;
  expiresAt: Date;
  txHash?: string;
  completedAt?: Date;
}

// Payment intent request
export interface CreatePaymentIntentRequest {
  amount: number;
  walletAddress: string;
  invoice: string;
}

// Payment intent response
export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  orderId: string;
}

// Balance response
export interface BalanceResponse {
  address: string;
  balance: string;
}

// Verify minting request
export interface VerifyMintingRequest {
  invoice?: string;
  wallet?: string;
}

// Verify minting response
export interface VerifyMintingResponse {
  minted: boolean;
  status?: string;
  txHash?: string;
  amount?: number;
  wallet?: string;
  invoice?: string;
  timestamp?: string;
  message?: string;
  error?: string;
  details?: string;
}

// Webhook response
export interface WebhookResponse {
  received: boolean;
  success?: boolean;
  transactionHash?: string;
  message?: string;
  error?: string;
  details?: string;
  mintError?: string;
}

// Mint tokens response
export interface MintTokensResponse {
  transactionHash: string;
  blockNumber: number;
  walletAddress: string;
  amount: number;
  invoice: string;
  timestamp: string;
}