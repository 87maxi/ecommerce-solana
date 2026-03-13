"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, ArrowRight, Loader2, ExternalLink } from "lucide-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connection } = useConnection();

  const [payment, setPayment] = useState<{
    status: "loading" | "success" | "error" | "processing";
    amount: string;
    invoice: string;
    wallet: string;
    txHash?: string;
    error?: string;
  }>({
    status: "loading",
    amount: "0",
    invoice: "",
    wallet: "",
  });

  const [updatedBalance, setUpdatedBalance] = useState<string | null>(null);

  const fetchUpdatedBalance = useCallback(
    async (address: string) => {
      if (!address || !connection) return;
      try {
        const mintAddressStr =
          process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
        if (!mintAddressStr || mintAddressStr.trim() === "") {
          throw new Error("Mint address not configured");
        }

        const cleanMint = mintAddressStr.trim();
        const cleanAddress = address.trim();

        const mint = new PublicKey(cleanMint);
        const userPubKey = new PublicKey(cleanAddress);
        const ata = await getAssociatedTokenAddress(mint, userPubKey);

        for (let i = 0; i < 5; i++) {
          try {
            const balanceInfo = await connection.getTokenAccountBalance(ata);
            setUpdatedBalance(balanceInfo.value.uiAmountString || "0");
            return;
          } catch (e) {
            if (i === 4) setUpdatedBalance("0");
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      } catch (error) {
        console.error("Error fetching updated balance:", error);
      }
    },
    [connection],
  );

  const verifyPurchase = useCallback(
    async (
      isMountedRef: React.MutableRefObject<boolean>,
      timeoutRef: React.MutableRefObject<any>,
    ) => {
      const paymentIntentId = searchParams.get("payment_intent");
      const status = searchParams.get("redirect_status");

      const isBrowser = typeof window !== "undefined";
      const storedAmount = isBrowser
        ? sessionStorage.getItem("amount") || "0"
        : "0";
      const storedInvoice = isBrowser
        ? sessionStorage.getItem("invoice") || ""
        : "";
      const storedWallet = isBrowser
        ? sessionStorage.getItem("wallet_address") || ""
        : "";

      if (status === "failed") {
        if (isMountedRef.current) {
          setPayment({
            status: "error",
            amount: storedAmount,
            invoice: storedInvoice,
            wallet: storedWallet,
            error: "El pago fue cancelado o rechazado por el banco.",
          });
        }
        return;
      }

      if (!paymentIntentId) {
        if (isMountedRef.current) {
          setPayment({
            status: "error",
            amount: storedAmount,
            invoice: storedInvoice,
            wallet: storedWallet,
            error: "No se encontró información del pago.",
          });
        }
        return;
      }

      try {
        const pasarelaUrl =
          process.env.NEXT_PUBLIC_PASARELA_PAGO_URL || "http://localhost:3034";
        const response = await fetch(
          pasarelaUrl + "/api/verify-minting?payment_intent=" + paymentIntentId,
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!isMountedRef.current) return;

        if (data.success) {
          setPayment({
            status: "success",
            amount: data.amount || storedAmount,
            invoice: data.invoice || storedInvoice,
            wallet: data.walletAddress || storedWallet,
            txHash: data.transactionHash,
          });
          const finalWallet = data.walletAddress || storedWallet;
          if (finalWallet) {
            fetchUpdatedBalance(finalWallet);
          }
        } else {
          if (isMountedRef.current) {
            setPayment({
              status: "processing",
              amount: storedAmount,
              invoice: storedInvoice,
              wallet: storedWallet,
            });
            timeoutRef.current = setTimeout(
              () => verifyPurchase(isMountedRef, timeoutRef),
              5000,
            );
          }
        }
      } catch (err) {
        console.error("Verification fetch error:", err);
        if (isMountedRef.current) {
          setPayment((prev) => ({
            ...prev,
            status: "error",
            error:
              err instanceof Error
                ? err.message
                : "Error de conexión con la pasarela. Reintentando...",
            amount: storedAmount,
            invoice: storedInvoice,
            wallet: storedWallet,
          }));
          timeoutRef.current = setTimeout(
            () => verifyPurchase(isMountedRef, timeoutRef),
            5000,
          );
        }
      }
    },
    [searchParams, fetchUpdatedBalance],
  );

  useEffect(() => {
    const isMountedRef = { current: true };
    const timeoutRef = { current: null as any };
    verifyPurchase(isMountedRef, timeoutRef);

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [verifyPurchase]);

  const handleReturnToStore = () => {
    const redirectUrl =
      sessionStorage.getItem("redirect_url") || "http://localhost:3030";
    window.location.href =
      redirectUrl +
      "?success=true&amount=" +
      payment.amount +
      "&invoice=" +
      payment.invoice +
      "&wallet=" +
      payment.wallet;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {payment.status === "success" && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
        )}

        <div className="text-center space-y-6">
          {payment.status === "loading" || payment.status === "processing" ? (
            <>
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Verificando Transacción
              </h1>
              <p className="text-slate-400">
                Confirmando pago y minteando EURT en la red de Solana...
              </p>
            </>
          ) : payment.status === "success" ? (
            <>
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              <h1 className="text-3xl font-bold text-white">
                ¡Compra Exitosa!
              </h1>
              <p className="text-slate-400">
                Tus tokens han sido enviados correctamente a tu wallet.
              </p>

              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 text-left space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Monto Minteado</span>
                  <span className="text-emerald-400 font-bold">
                    {payment.amount} EURT
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Factura</span>
                  <span className="text-white font-mono">
                    {payment.invoice}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-700 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Nuevo Balance
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-white">
                        {updatedBalance || "..."}
                      </span>
                      <span className="text-xs text-slate-400">EURT</span>
                    </div>
                  </div>
                  {payment.txHash && (
                    <a
                      href={
                        "https://explorer.solana.com/tx/" +
                        payment.txHash +
                        "?cluster=custom&customUrl=http://localhost:8899"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 transition-colors"
                    >
                      Explorador <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <button
                onClick={handleReturnToStore}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
              >
                Volver a la Tienda
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">❌</span>
              </div>
              <h1 className="text-2xl font-bold text-white">
                Hubo un Problema
              </h1>
              <p className="text-red-400 text-sm">
                {payment.error ||
                  "No pudimos verificar la transacción automáticamente."}
              </p>
              <button
                onClick={() => router.push("/")}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all"
              >
                Reintentar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}
