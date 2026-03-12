"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Force dynamic rendering to avoid SSR issues with window/sessionStorage
export const dynamic = 'force-dynamic';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [payment, setPayment] = useState<any>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [updatedBalance, setUpdatedBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [walletConfirmed, setWalletConfirmed] = useState(false); // New state for wallet confirmation

  // Function to fetch updated balance
  const fetchUpdatedBalance = async (walletAddress: string) => {
    if (!window.ethereum) return;

    setLoadingBalance(true);
    try {
      const contractAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
      if (!contractAddress) {
        console.error('[SUCCESS] Contract address not found');
        return;
      }

      const balanceHex = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: `0x70a08231000000000000000000000000${walletAddress.slice(2)}`,
        }, 'latest'],
      });

      const balanceWei = parseInt(balanceHex, 16);
      const balanceEther = (balanceWei / 1e6).toFixed(2); // EuroToken uses 6 decimals
      setUpdatedBalance(balanceEther);
      console.log('[SUCCESS] Updated balance:', balanceEther, 'EURT');
    } catch (error) {
      console.error('[SUCCESS] Error fetching balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Trigger confetti animation
    setShowConfetti(true);

    // Check if we should redirect to a custom URL (from web-customer)
    const storedRedirect = sessionStorage.getItem('redirect_url');
    const storedInvoice = sessionStorage.getItem('invoice');
    const storedAmount = sessionStorage.getItem('amount');
    const storedWallet = sessionStorage.getItem('wallet_address');

    // Get params from URL (Stripe return)
    const urlWallet = params.get('wallet');
    const urlTokens = params.get('tokens');
    const urlInvoice = params.get('invoice');

    if (storedRedirect) {
      // Payment was successful, verify minting before redirecting
      setRedirecting(true);

      const finalAmount = storedAmount || urlTokens || '0';
      const finalInvoice = storedInvoice || urlInvoice || '';
      const finalWallet = storedWallet || urlWallet || '';

      // Verificar si los tokens fueron minteados exitosamente
      const verifyMinting = async () => {
        try {
          const pasarelaUrl = process.env.NEXT_PUBLIC_PASARELA_PAGO_URL || 'http://localhost:3034';

          // Get payment_intent from URL (Stripe includes this in the return_url)
          const paymentIntentParam = params.get('payment_intent');

          console.log('[SUCCESS] Payment intent from URL:', paymentIntentParam);

          if (!paymentIntentParam) {
            console.error('[SUCCESS] No payment_intent in URL, cannot mint tokens');
            setPayment({
              amount: finalAmount,
              invoice: finalInvoice,
              wallet: finalWallet,
              status: 'error',
              error: 'No payment intent ID found'
            });
            return;
          }

          // Call mint-after-payment endpoint
          console.log('[SUCCESS] Calling mint-after-payment endpoint...');
          const mintResponse = await fetch(`${pasarelaUrl}/api/mint-after-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntentParam
            })
          });

          if (mintResponse.ok) {
            const mintData = await mintResponse.json();

            if (mintData.success) {
              console.log('✅ Tokens minteados exitosamente:', mintData);
              setPayment({
                amount: finalAmount,
                invoice: finalInvoice,
                wallet: finalWallet,
                status: 'success',
                txHash: mintData.transactionHash
              });

              // Fetch updated balance after minting
              await fetchUpdatedBalance(finalWallet);

              // Clean up session storage
              sessionStorage.removeItem('redirect_url');
              sessionStorage.removeItem('invoice');
              sessionStorage.removeItem('amount');
              sessionStorage.removeItem('wallet_address');

              // Store redirect URL for manual navigation
              sessionStorage.setItem('final_redirect_url', `${storedRedirect}?success=true&tokens=${finalAmount}&invoice=${finalInvoice}&wallet=${finalWallet}&txHash=${mintData.transactionHash}`);

              return;
            } else {
              console.error('❌ Error en minting:', mintData);
              setPayment({
                amount: finalAmount,
                invoice: finalInvoice,
                wallet: finalWallet,
                status: 'error',
                error: mintData.error || 'Minting failed'
              });
            }
          } else {
            const errorData = await mintResponse.json();
            console.error('❌ Error en respuesta de minting:', errorData);
            setPayment({
              amount: finalAmount,
              invoice: finalInvoice,
              wallet: finalWallet,
              status: 'error',
              error: errorData.error || 'Minting request failed'
            });
          }

        } catch (error) {
          console.error('Error minteando tokens:', error);
          setPayment({
            amount: finalAmount,
            invoice: finalInvoice,
            wallet: finalWallet,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      };

      verifyMinting();
      setPayment({ amount: finalAmount, invoice: finalInvoice });
      return;
    }

    // Fallback: show local success page
    const wallet = params.get('wallet');
    const tokens = params.get('tokens');

    if (wallet && tokens) {
      setPayment({ wallet, amount: tokens });
      // Fetch updated balance
      fetchUpdatedBalance(wallet);
    }
  }, []);

  if (redirecting) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative overflow-hidden animate-in zoom-in duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"></div>

          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
            <div className="relative inline-block p-4 bg-slate-900/50 rounded-full border border-emerald-500/30">
              <svg className="animate-spin h-12 w-12 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">¡Pago Exitoso!</h1>
          <p className="text-slate-400 mb-4">Verificando tokens y redirigiendo a la tienda...</p>

          <div className="inline-flex items-center gap-2 text-sm text-indigo-300 bg-indigo-900/20 px-3 py-1.5 rounded-full border border-indigo-500/30 mb-6">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span>Verificando minting de tokens</span>
          </div>

          {payment && (
            <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Tokens adquiridos</span>
                <span className="text-emerald-400 font-mono font-bold text-lg">{payment.amount} EURT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Estado</span>
                <span className="text-sm font-medium">
                  {payment.status === 'success' && (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Tokens minteados
                    </span>
                  )}
                  {payment.status === 'verification_failed' && (
                    <span className="text-amber-400">Verificación pendiente</span>
                  )}
                  {payment.status === 'error' && (
                    <div className="flex flex-col gap-1.5 text-red-400">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        <span>Error en minting</span>
                      </div>
                      <span className="text-xs opacity-80 break-words">{payment.error}</span>
                    </div>
                  )}
                </span>
              </div>
              {payment.wallet && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-slate-400 text-sm">Wallet</span>
                  <span className="text-xs font-mono text-indigo-300">{payment.wallet.slice(0, 6)}...{payment.wallet.slice(-4)}</span>
                </div>
              )}
              {payment.txHash && (
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-slate-400 text-xs mb-2">Hash de Transacción</p>
                  <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2">
                    <code className="text-xs font-mono text-emerald-300 flex-1 overflow-hidden text-ellipsis">
                      {payment.txHash.slice(0, 20)}...{payment.txHash.slice(-18)}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(payment.txHash);
                        // Could add a toast notification here
                      }}
                      className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                      title="Copiar hash"
                    >
                      <svg className="w-4 h-4 text-slate-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Updated Balance Section */}
              {updatedBalance !== null && (
                <div className="pt-3 border-t border-slate-800">
                  <div className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 rounded-xl p-4 border border-emerald-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                    <div className="relative">
                      <p className="text-xs text-emerald-300 font-medium uppercase tracking-wider mb-2">Balance Final EURT</p>
                      <div className="flex items-baseline gap-2">
                        <p className="font-mono font-bold text-3xl text-emerald-400">
                          {updatedBalance}
                        </p>
                        <span className="text-emerald-300 font-medium text-lg">EURT</span>
                      </div>
                      <p className="text-xs text-emerald-400/60 mt-1">
                        ≈ €{parseFloat(updatedBalance).toFixed(2)} EUR
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {loadingBalance && (
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-3">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Actualizando balance...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Wallet Confirmation Flow */}
          {/* Strict Linear Flow: Verify -> Return */}
          {payment?.status === 'success' && (
            <div className="mt-6 space-y-4">
              {/* Token Detection Status */}
              <div className={`rounded-xl p-4 border ${updatedBalance && parseFloat(updatedBalance) > 0 ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {updatedBalance && parseFloat(updatedBalance) > 0 ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className={`font-medium text-sm ${updatedBalance && parseFloat(updatedBalance) > 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {updatedBalance && parseFloat(updatedBalance) > 0
                          ? 'Tokens detectados en Wallet'
                          : 'Buscando tokens en Wallet...'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {updatedBalance
                          ? `Balance actual: ${updatedBalance} EURT`
                          : 'Esperando confirmación de blockchain...'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => payment.wallet && fetchUpdatedBalance(payment.wallet)}
                    disabled={loadingBalance}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    title="Verificar nuevamente"
                  >
                    <svg className={`w-5 h-5 text-indigo-400 ${loadingBalance ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Verification Step */}
              <div className={`transition-all duration-500 ${walletConfirmed ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <button
                  onClick={async () => {
                    if (!window.ethereum) return;
                    try {
                      const tokenAddress = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
                      console.log('[SUCCESS] Attempting to watch asset:', {
                        address: tokenAddress,
                        symbol: 'EURT',
                        decimals: 6
                      });

                      if (!tokenAddress) {
                        throw new Error('Contract address is missing in environment variables');
                      }

                      await window.ethereum.request({
                        method: 'wallet_watchAsset',
                        params: {
                          type: 'ERC20',
                          options: {
                            address: tokenAddress,
                            symbol: 'EURT',
                            decimals: 6,
                          },
                        },
                      });
                      console.log('[SUCCESS] Asset added/verified in wallet');
                      setWalletConfirmed(true);
                    } catch (error: any) {
                      console.error('[SUCCESS] Error adding token:', error);

                      // Fallback for Rabby/Wallets that fail watchAsset but have tokens
                      // If we already detected a positive balance, we can assume it's safe to proceed
                      if (updatedBalance && parseFloat(updatedBalance) > 0) {
                        console.log('[SUCCESS] Tokens detected in balance, bypassing watchAsset error');
                        setWalletConfirmed(true);
                        return; // Exit successfully
                      }

                      // Try to extract a meaningful message
                      const errorMessage = error?.message || error?.code || JSON.stringify(error);
                      console.error('[SUCCESS] Detailed error:', errorMessage);

                      // If user rejected, we can optionally show a message
                      if (error?.code === 4001) {
                        alert('Has rechazado la solicitud. Debes aceptar para verificar.');
                      } else {
                        alert(`No pudimos agregar el token automáticamente. Si ya lo ves en tu wallet, ignora este mensaje. Error: ${errorMessage}`);
                        // Optional: Allow them to proceed if they claim they see it? 
                        // For now, let's rely on the balance check above.
                      }
                    }
                  }}
                  className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${walletConfirmed
                    ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-bold'
                    }`}
                >
                  {walletConfirmed ? (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Wallet Verificada</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>1. Verificar en MetaMask (Requerido)</span>
                    </>
                  )}
                </button>
                {!walletConfirmed && (
                  <p className="text-center text-xs text-amber-400/80 mt-2">
                    * Debes completar este paso para continuar
                  </p>
                )}
              </div>

              {/* Return Step - DISABLED until confirmed */}
              <div className={`transition-all duration-500 ${!walletConfirmed ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                <button
                  onClick={() => {
                    if (!walletConfirmed) return; // Prevent click if not confirmed
                    const redirectUrl = sessionStorage.getItem('final_redirect_url');
                    if (redirectUrl) {
                      window.location.href = redirectUrl;
                    }
                  }}
                  disabled={!walletConfirmed}
                  className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${!walletConfirmed
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-bold'
                    }`}
                >
                  <span>2. Volver a la Tienda</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {payment?.status !== 'success' && (
            <p className="text-xs text-slate-500 mt-6">
              {payment?.status === 'error' ? 'Hubo un error. Por favor contacta soporte.' : 'Procesando...'}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Confetti animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                backgroundColor: ['#6366f1', '#a855f7', '#06b6d4', '#10b981'][Math.floor(Math.random() * 4)],
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}


      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative overflow-hidden animate-in zoom-in duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"></div>

        {/* Success Icon */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
          <div className="relative inline-block p-4 bg-slate-900/50 rounded-full border border-emerald-500/30 animate-in zoom-in duration-700">
            <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">¡Pago Exitoso!</h1>
        <p className="text-slate-400 mb-8">La transacción se ha completado correctamente.</p>

        {payment ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-slate-400 text-sm">Monto Total</span>
                <span className="text-white font-mono font-bold text-lg">€{payment.amount}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400 text-sm">Tokens Recibidos</span>
                <span className="text-emerald-400 font-mono font-bold text-lg">{payment.amount} EURT</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <p className="text-xs text-indigo-300 mb-1">Enviado a la billetera</p>
              <p className="font-mono text-sm text-indigo-200 break-all">{payment.wallet}</p>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              Los tokens deberían aparecer en tu billetera en unos momentos.
            </p>
          </div>
        ) : (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-slate-700/50 rounded-xl"></div>
            <div className="h-12 bg-slate-700/50 rounded-lg"></div>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}