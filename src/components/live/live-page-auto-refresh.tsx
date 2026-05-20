"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const LivePageAutoRefresh = () => {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      router.refresh();
    };

    const intervalId = window.setInterval(refresh, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [router]);

  return null;
};
