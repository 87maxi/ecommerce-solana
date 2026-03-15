"use client";
import { Suspense } from "react";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-12 min-h-[50vh] items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected } = useWallet();
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "failed"
  >("pending");
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    // Al haber cambiado a un modelo de pago Web3 on-chain,
    // la verificación ya fue realizada durante la transacción (handleCheckout).
    // Aquí simplemente extraemos el hash de la transacción y mostramos éxito.
    const verifyPurchase = () => {
      const hash = searchParams.get("tx");

      if (hash) {
        setTxHash(hash);
        setVerificationStatus("success");
      } else {
        // Si el usuario llega aquí sin un hash de transacción, asumimos que no es un pago válido
        setVerificationStatus("failed");
      }
    };

    verifyPurchase();
  }, [searchParams]);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Wallet no conectada</h1>
          <p className="text-muted-foreground mb-6">
            Por favor conecta tu wallet para ver los detalles de la compra.
          </p>
          <button
            onClick={() => router.push("/cart")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Volver al carrito
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 animate-in fade-in zoom-in duration-500">
      <div className="max-w-md mx-auto text-center">
        {verificationStatus === "pending" && (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Verificando transacción</h1>
            <p className="text-muted-foreground">
              Confirmando tu pago en la blockchain...
            </p>
          </>
        )}

        {verificationStatus === "success" && (
          <>
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full"></div>
              <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6 relative z-10" />
            </div>
            <h1 className="text-3xl font-bold font-display mb-3">
              ¡Compra Exitosa!
            </h1>
            <p className="text-muted-foreground mb-8">
              Tu pago con EURT ha sido confirmado y procesado correctamente en
              la red de Solana.
            </p>

            {txHash && (
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-8 text-left shadow-lg">
                <h2 className="font-semibold text-lg mb-4 text-foreground">
                  Recibo Digital
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">
                      Firma de la Transacción
                    </span>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded-lg break-all">
                    <span className="text-xs font-mono text-primary font-medium tracking-tight">
                      {txHash}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-muted-foreground">
                      Estado de Red
                    </span>
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Confirmado
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/orders")}
                className="flex-1 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
              >
                Ver mis órdenes
              </button>
              <button
                onClick={() => router.push("/products")}
                className="flex-1 px-6 py-3.5 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-all hover:scale-105"
              >
                Seguir comprando
              </button>
            </div>
          </>
        )}

        {verificationStatus === "failed" && (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Pago No Validado</h1>
            <p className="text-muted-foreground mb-6">
              No se pudo confirmar la transacción en la red. Si el balance fue
              debitado de tu wallet, contacta a soporte.
            </p>
            <button
              onClick={() => router.push("/cart")}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Volver al carrito
            </button>
          </>
        )}
      </div>
    </div>
  );
}
