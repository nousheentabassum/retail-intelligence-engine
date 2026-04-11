"use client";

import { useEffect, useState } from "react";
import { fetchInventory } from "../services/inventory.service";

export function useInventory(productId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchInventory(productId);
        if (mounted) setData(res);
      } catch {
        if (mounted) setError("Failed to load inventory");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [productId]);

  return { data, loading, error };
}

