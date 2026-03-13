"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import WalletConnect from "./WalletConnect";
import PurchaseSteps from "./PurchaseSteps";
import AmountSelector from "./AmountSelector";
import StripePaymentForm from "./StripePaymentForm";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export default function EuroTokenPurchase() {
  // State for amount to purchase in euros
  const [amount, setAmount] = useState<number>(100);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const { connection } = useConnection();
  const { connected } = useWallet();

  // New states for validation and confirmation
  const [validationResult, setValidationResult] = useState<{
    contractDeployed: boolean;
    currentBalance: string;
    blockNumber: number;
    contractAddress: string;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    // Check for URL parameters (from web-customer redirection)
    const params = new URLSearchParams(window.location.search);
    const urlAmount = params.get("amount");
    const urlInvoice = params.get("invoice");
    const urlRedirect = params.get("redirect");

    if (urlAmount) {
      const parsedAmount = parseFloat(urlAmount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        setAmount(parsedAmount);
      }
    }

    if (urlRedirect) {
      sessionStorage.setItem("redirect_url", urlRedirect);
    }

    if (urlInvoice) {
      sessionStorage.setItem("invoice", urlInvoice);
    }

    if (urlAmount) {
      sessionStorage.setItem("amount", urlAmount);
    }
  }, []);

  // Validation function for Solana
  const validateBeforeRedirect = async (address: string) => {
    setIsValidating(true);
    setValidationError(null);

    try {
      const mintAddressStr = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
      if (!mintAddressStr || mintAddressStr.trim() === "") {
        throw new Error("Dirección del Mint de EuroToken no configurada");
      }

      // Limpiar y validar direcciones
      const cleanMint = mintAddressStr.trim();
      const cleanAddress = address.trim();

      console.log("[VALIDATION] Checking Solana connection and Mint...");

      // 1. Verificar conectividad y obtener slot actual
      const slot = await connection.getSlot();

      // 2. Obtener balance actual de EURT en Solana
      let mint: PublicKey;
      let userPubKey: PublicKey;

      try {
        mint = new PublicKey(cleanMint);
        userPubKey = new PublicKey(cleanAddress);
      } catch (e) {
        throw new Error("Formato de clave pública inválido (Base58 error)");
      }

      const ata = await getAssociatedTokenAddress(mint, userPubKey);

      let balanceFormatted = "0.00";
      try {
        const balanceInfo = await connection.getTokenAccountBalance(ata);
        balanceFormatted = balanceInfo.value.uiAmountString || "0.00";
      } catch (e) {
        // ATA might not exist yet, which is fine for a purchase
        console.log("[VALIDATION] ATA not found, assuming zero balance");
      }

      const result = {
        contractDeployed: true,
        currentBalance: balanceFormatted,
        blockNumber: slot,
        contractAddress: mintAddressStr,
      };

      console.log("[VALIDATION] Validation successful:", result);
      setValidationResult(result);
      setIsValidating(false);
      return result;
    } catch (err: any) {
      console.error("[VALIDATION] Error:", err);
      setValidationError(err.message || "Error al validar la transacción");
      setIsValidating(false);
      throw err;
    }
  };

  const handleWalletConnected = async (address: string) => {
    console.log("Wallet connected:", address);

    // Validar y limpiar la dirección de la wallet
    if (!address || address.trim() === "") {
      setError("La dirección de la wallet no puede estar vacía");
      return;
    }
    const cleanedAddress = address.trim();

    // Validar que la dirección tenga la longitud correcta
    if (cleanedAddress.length < 32 || cleanedAddress.length > 44) {
      setError("La longitud de la dirección de la wallet es inválida");
      return;
    }

    // Validar que la dirección contenga solo caracteres Base58
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(cleanedAddress)) {
      setError("La dirección de la wallet contiene caracteres no válidos");
      return;
    }

    // Si la dirección es válida, continuar con el proceso
    setWalletAddress(cleanedAddress);
    sessionStorage.setItem("wallet_address", cleanedAddress);

    try {
      await validateBeforeRedirect(cleanedAddress);
      setCurrentStep(2.5);
    } catch (err) {
      setError(
        "Error al validar: " +
          (err instanceof Error ? err.message : "Error desconocido"),
      );
    }
  };

  const handleConfirmTransaction = async () => {
    if (!walletAddress) {
      setError("Dirección de wallet no encontrada");
      return;
    }

    // Asegurar que la dirección esté limpia antes de enviar
    const cleanAddress = walletAddress.trim();

    // Validación de seguridad de último minuto para evitar errores de Base58
    try {
      new PublicKey(cleanAddress);
    } catch (e) {
      console.error(
        "[CONFIRM] Invalid wallet address for Solana:",
        cleanAddress,
      );
      setError("La dirección de la wallet es inválida (Base58 error)");
      return;
    }

    setCurrentStep(3);

    const pasarelaUrl =
      process.env.NEXT_PUBLIC_PASARELA_PAGO_URL || "http://localhost:3034";
    const invoice = sessionStorage.getItem("invoice") || "EURT_" + Date.now();

    try {
      console.log("[CONFIRM] Creating payment intent for:", {
        amount,
        walletAddress: cleanAddress,
        invoice,
      });

      const res = await fetch(`${pasarelaUrl}/api/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          walletAddress: cleanAddress,
          invoice: invoice,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setClientSecret(data.clientSecret);
    } catch (err: any) {
      console.error("Error creating payment intent:", err);
      setError("Error al iniciar el pago: " + err.message);
      setCurrentStep(2.5);
    }
  };

  const handleCancelConfirmation = () => {
    setCurrentStep(2);
    setValidationResult(null);
    setValidationError(null);
  };

  const handleContinueToWallet = () => {
    if (amount >= 10 && amount <= 10000) {
      setCurrentStep(2);
      setError(null);
    } else {
      setError("Por favor selecciona un monto válido entre €10 y €10,000");
    }
  };

  // Step 2.5: Transaction Confirmation
  if (currentStep === 2.5) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 sm:px-0 animate-in fade-in duration-500">
        <PurchaseSteps currentStep={3} />

        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 shadow-[0_0_50px_rgba(99,102,241,0.15)] rounded-3xl p-6 sm:p-8 space-y-6 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-50"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>

          <button
            onClick={handleCancelConfirmation}
            className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors group relative z-10"
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver
          </button>

          <div className="text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-300 tracking-tight">
              Confirmar Transacción
            </h2>
            <p className="text-slate-400 font-medium text-sm sm:text-base mt-3">
              Revisa los detalles antes de proceder al pago
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
                Resumen de Compra
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Monto a Pagar</span>
                  <span className="text-white font-mono font-bold text-xl">
                    €{amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                  <span className="text-slate-400">Tokens a Recibir</span>
                  <span className="text-emerald-400 font-mono font-bold text-xl">
                    {amount} EURT
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                  <span className="text-slate-400 text-sm">Wallet Destino</span>
                  <span className="text-indigo-300 font-mono text-xs">
                    {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
                  </span>
                </div>
              </div>
            </div>

            {isValidating && (
              <div className="bg-indigo-900/20 rounded-xl p-4 border border-indigo-500/30">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-400 border-t-transparent"></div>
                  <span className="text-indigo-300 text-sm">
                    Validando en Solana...
                  </span>
                </div>
              </div>
            )}

            {validationError && (
              <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/30">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-300 font-medium text-sm mb-1">
                      Error de Validación
                    </p>
                    <p className="text-red-400 text-xs whitespace-pre-line">
                      {validationError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {validationResult && !isValidating && (
              <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-emerald-300 font-medium text-sm">
                    Validación Exitosa
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-400/70">Mint Verificado</span>
                    <span className="text-emerald-300 font-mono">
                      {validationResult.contractAddress.slice(0, 12)}...
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-400/70">Balance Actual</span>
                    <span className="text-emerald-300 font-mono">
                      {validationResult.currentBalance} EURT
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-400/70">Slot Solana</span>
                    <span className="text-emerald-300 font-mono">
                      #{validationResult.blockNumber}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative z-10 space-y-3">
            <button
              onClick={handleConfirmTransaction}
              disabled={isValidating || !!validationError || !validationResult}
              className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-800 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:shadow-none transition-all duration-300 py-4 px-6 rounded-xl font-bold text-lg transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 skew-y-12"></div>
              <div className="relative flex items-center justify-center space-x-3">
                <span>Confirmar y Proceder al Pago</span>
                <svg
                  className="w-5 h-5 opacity-70 group-hover/btn:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </button>
            <button
              onClick={handleCancelConfirmation}
              className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-xl font-medium transition-all duration-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Stripe Form
  if (currentStep === 3) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 sm:px-0 animate-in fade-in duration-500">
        <PurchaseSteps currentStep={3} />
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 shadow-[0_0_50px_rgba(99,102,241,0.15)] rounded-3xl p-6 sm:p-8 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-50"></div>
          <div className="text-center relative z-10 mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-300 tracking-tight">
              Pago Seguro
            </h2>
            <p className="text-slate-400 font-medium text-sm mt-2">
              Completa tu compra con tarjeta
            </p>
          </div>
          {!clientSecret ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-900 border-t-indigo-500"></div>
              <p className="mt-4 text-slate-500 text-sm animate-pulse">
                Iniciando pasarela segura...
              </p>
            </div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: clientSecret,
                locale: "es",
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#6366f1",
                    colorBackground: "#1e293b",
                    colorText: "#f8fafc",
                    colorDanger: "#ef4444",
                    fontFamily: "ui-sans-serif, system-ui, sans-serif",
                  },
                },
              }}
            >
              <StripePaymentForm
                amount={amount}
                walletAddress={walletAddress!}
                invoice={
                  sessionStorage.getItem("invoice") || "EURT_" + Date.now()
                }
                redirectUrl={window.location.origin + "/success"}
              />
            </Elements>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Wallet Connection
  if (currentStep === 2) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 sm:px-0 animate-in fade-in duration-500">
        <PurchaseSteps currentStep={currentStep} />
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 shadow-[0_0_50px_rgba(99,102,241,0.15)] rounded-3xl p-6 sm:p-8 space-y-8 transition-all duration-500 hover:shadow-[0_0_80px_rgba(99,102,241,0.25)] hover:border-indigo-500/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-50"></div>
          <button
            onClick={() => setCurrentStep(1)}
            className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors group relative z-10"
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Cambiar monto
          </button>
          <div className="text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-300 tracking-tight">
              Conecta tu Wallet
            </h2>
            <p className="text-slate-400 font-medium text-sm sm:text-base mt-3">
              Los tokens serán enviados a tu billetera de Solana
            </p>
            <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <span className="text-sm text-slate-400">Comprando:</span>
              <div className="flex items-center gap-2">
                <strong className="text-emerald-400 text-lg font-mono">
                  {amount} EURT
                </strong>
                <span className="text-slate-500">≈</span>
                <span className="text-white font-mono">
                  €{amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-300 rounded-xl text-sm text-center relative z-10">
              {error}
            </div>
          )}
          <div className="relative z-10">
            <WalletConnect onWalletConnected={handleWalletConnected} />
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Default
  return (
    <div className="w-full max-w-lg mx-auto px-4 sm:px-0 animate-in fade-in duration-500">
      <PurchaseSteps currentStep={currentStep} />
      <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 shadow-[0_0_50px_rgba(99,102,241,0.15)] rounded-3xl p-6 sm:p-8 space-y-8 transition-all duration-500 hover:shadow-[0_0_80px_rgba(99,102,241,0.25)] hover:border-indigo-500/30 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-50"></div>
        <div className="text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-300 tracking-tight">
            Compra EURT
          </h2>
          <div className="flex items-center justify-center gap-3 mt-3">
            <p className="text-slate-400 font-medium text-sm sm:text-base">
              1 EUR = 1 EURT
            </p>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="text-[10px] text-cyan-300 font-mono bg-cyan-900/30 px-2 py-0.5 rounded border border-cyan-500/30 uppercase tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              Stablecoin
            </span>
          </div>
        </div>
        <div className="relative z-10">
          <AmountSelector
            amount={amount}
            onChange={setAmount}
            min={10}
            max={10000}
          />
        </div>
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-300 rounded-xl text-sm text-center relative z-10 animate-in slide-in-from-top-1">
            {error}
          </div>
        )}
        <div className="relative z-10">
          <button
            onClick={handleContinueToWallet}
            disabled={amount < 10 || amount > 10000}
            className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-800 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:shadow-none transition-all duration-300 py-4 px-6 rounded-xl font-bold text-lg transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 skew-y-12"></div>
            <div className="relative flex items-center justify-center space-x-3">
              <span>Continuar</span>
              <svg
                className="w-5 h-5 opacity-70 group-hover/btn:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
