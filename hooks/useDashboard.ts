"use client";

import { useQuery } from "@tanstack/react-query";
import { db as supabase } from "@/lib/supabase";

export function useUserDashboard(userId: string) {
  return useQuery({
    queryKey: ["user-dashboard", userId],
    queryFn: async () => {
      const { data: copied, error } = await supabase
        .from("copied_trades")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const totalProfit = copied?.reduce((sum, t) => sum + (t.profit ?? 0), 0) ?? 0;
      const executed = copied?.filter((t) => t.status === "copied") ?? [];
      const skipped = copied?.filter((t) => t.status === "skipped") ?? [];
      const wins = executed.filter((t) => t.result === "win");
      const roi = executed.length > 0
        ? (totalProfit / executed.reduce((s, t) => s + t.stake, 0)) * 100
        : 0;

      return {
        totalProfit,
        roi,
        totalCopied: copied?.length ?? 0,
        executed: executed.length,
        skipped: skipped.length,
        winRate: executed.length > 0 ? (wins.length / executed.length) * 100 : 0,
        trades: copied ?? [],
      };
    },
    enabled: !!userId,
  });
}

export function useTraderDashboard(traderId: string) {
  return useQuery({
    queryKey: ["trader-dashboard", traderId],
    queryFn: async () => {
      const [statsRes, subsRes, withdrawalsRes] = await Promise.all([
        supabase.from("trader_stats").select("*").eq("trader_id", traderId).single(),
        supabase.from("subscriptions").select("*, plans(price)").eq("trader_id", traderId).eq("status", "active"),
        supabase.from("withdrawals").select("*").eq("trader_id", traderId),
      ]);

      const stats = statsRes.data;
      const subs = subsRes.data ?? [];
      const withdrawals = withdrawalsRes.data ?? [];

      const monthlyRevenue = subs.reduce((sum, s) => {
        const plan = s.plans as unknown as { price: number } | null;
        return sum + (plan?.price ?? 0);
      }, 0);

      const totalRevenue = monthlyRevenue * 12;
      const balance = totalRevenue - withdrawals.filter((w) => w.status === "paid").reduce((s, w) => s + w.amount, 0);
      const pending = withdrawals.filter((w) => w.status === "pending").reduce((s, w) => s + w.amount, 0);

      return {
        stats,
        followers: subs.length,
        monthlyRevenue,
        totalRevenue,
        balance,
        pendingWithdrawals: pending,
        withdrawals,
        subscriptions: subs,
      };
    },
    enabled: !!traderId,
  });
}
