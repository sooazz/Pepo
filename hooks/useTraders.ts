"use client";

import { useQuery } from "@tanstack/react-query";
import { db as supabase } from "@/lib/supabase";
import type { TraderWithStats } from "@/types";

export interface TraderFilters {
  market?: string;
  minRoi?: number;
  maxDrawdown?: number;
  maxPrice?: number;
  search?: string;
}

export function useTraders(filters?: TraderFilters) {
  return useQuery({
    queryKey: ["traders", filters],
    queryFn: async () => {
      let query = supabase
        .from("traders")
        .select(`
          *,
          trader_stats(*),
          plans(*)
        `)
        .eq("is_public", true);

      if (filters?.search) {
        query = query.ilike("display_name", `%${filters.search}%`);
      }
      if (filters?.market) {
        query = query.contains("markets", [filters.market]);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data as TraderWithStats[]) ?? [];

      if (filters?.minRoi !== undefined) {
        result = result.filter(
          (t) => (t.trader_stats?.roi_monthly ?? 0) >= filters.minRoi!
        );
      }
      if (filters?.maxDrawdown !== undefined) {
        result = result.filter(
          (t) => (t.trader_stats?.drawdown ?? 0) <= filters.maxDrawdown!
        );
      }
      if (filters?.maxPrice !== undefined) {
        result = result.filter(
          (t) => Math.min(...(t.plans?.map((p) => p.price) ?? [0])) <= filters.maxPrice!
        );
      }

      return result;
    },
  });
}

export function useTrader(id: string) {
  return useQuery({
    queryKey: ["trader", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traders")
        .select(`
          *,
          trader_stats(*),
          plans(*)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as TraderWithStats;
    },
    enabled: !!id,
  });
}

export function useTraderTrades(traderId: string) {
  return useQuery({
    queryKey: ["trader-trades", traderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("trader_id", traderId)
        .order("opened_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!traderId,
  });
}
