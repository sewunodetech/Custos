"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

/**
 * Redirects to /connect if wallet is not connected.
 * Call inside any dashboard client component or layout.
 */
export function useAuthGuard() {
  const { isConnected, isConnecting, address } = useAccount();
  const router = useRouter();

  useEffect(() => {
    // Wait until wagmi has resolved connection status
    if (isConnecting) return;
    if (!isConnected) {
      router.replace("/connect");
    }
  }, [isConnected, isConnecting, router]);

  return { isConnected, address };
}
