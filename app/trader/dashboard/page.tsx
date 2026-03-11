"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/shared/StatCard";
import { RevenueChart } from "@/components/shared/RevenueChart";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db as supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { toast } from "sonner";
import {
  Users, DollarSign, TrendingUp, Activity, Play, Pause, Power,
} from "lucide-react";

type CopyStatus = "ACTIVE" | "PAUSING" | "OFF";

function useMyTrader(userId: string) {
  return useQuery({
    queryKey: ["my-trader", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traders")
        .select("*, trader_stats(*)")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function TraderDashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: trader, isLoading } = useMyTrader(user?.id ?? "");

  const revenueData = MONTHS.slice(0, new Date().getMonth() + 1).map((month, i) => ({
    month,
    revenue: Math.random() * 3000 + 500 * (i + 1),
  }));

  const setStatusMutation = useMutation({
    mutationFn: async (status: CopyStatus) => {
      if (!trader) return;
      if (status === "OFF") {
        const { data: openTrades } = await supabase
          .from("trades")
          .select("id")
          .eq("trader_id", trader.id)
          .eq("status", "open");
        if ((openTrades?.length ?? 0) > 0) {
          throw new Error("Não é possível desligar o copy com trades abertos");
        }
      }
      const { error } = await supabase
        .from("traders")
        .update({ copy_status: status })
        .eq("id", trader.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-trader"] });
      toast.success("Status atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Painel do Trader</h1>
            <p className="text-muted-foreground mt-1">Gerencie seu copy trading e acompanhe seus resultados</p>
          </div>

          {/* Copy Status Controls */}
          {trader && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status do Copy:</span>
                <Badge variant={
                  trader.copy_status === "ACTIVE" ? "default" :
                  trader.copy_status === "PAUSING" ? "secondary" : "destructive"
                } className="text-sm">
                  {trader.copy_status}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10"
                  onClick={() => setStatusMutation.mutate("ACTIVE")}
                  disabled={trader.copy_status === "ACTIVE" || setStatusMutation.isPending}>
                  <Play className="w-3.5 h-3.5" /> Ativar
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-amber-400 border-amber-400/30 hover:bg-amber-400/10"
                  onClick={() => setStatusMutation.mutate("PAUSING")}
                  disabled={trader.copy_status === "PAUSING" || setStatusMutation.isPending}>
                  <Pause className="w-3.5 h-3.5" /> Pausar
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-red-400 border-red-400/30 hover:bg-red-400/10"
                  onClick={() => setStatusMutation.mutate("OFF")}
                  disabled={trader.copy_status === "OFF" || setStatusMutation.isPending}>
                  <Power className="w-3.5 h-3.5" /> Desligar
                </Button>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : !trader ? (
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-8 text-center text-muted-foreground">
              Você ainda não tem perfil de trader. Entre em contato com o suporte para ativar.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Seguidores" value={String(trader.trader_stats?.followers_count ?? 0)} icon={Users} />
              <StatCard title="ROI Mensal" value={formatPercent(trader.trader_stats?.roi_monthly ?? 0)}
                icon={TrendingUp} trend={(trader.trader_stats?.roi_monthly ?? 0) >= 0 ? "up" : "down"} />
              <StatCard title="Lucro Total" value={formatCurrency(trader.trader_stats?.total_profit ?? 0)}
                icon={DollarSign} trend={(trader.trader_stats?.total_profit ?? 0) >= 0 ? "up" : "down"} />
              <StatCard title="Win Rate" value={`${(trader.trader_stats?.win_rate ?? 0).toFixed(1)}%`}
                icon={Activity} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-base">Receita Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <RevenueChart data={revenueData} height={200} />
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-base">Perfil Público</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Visibilidade</span>
                    <Badge variant={trader.is_public ? "default" : "secondary"}>
                      {trader.is_public ? "Público" : "Privado"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de Trades</span>
                    <span className="font-mono">{trader.trader_stats?.total_trades ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Drawdown</span>
                    <span className="font-mono text-amber-400">
                      {formatPercent(-(trader.trader_stats?.drawdown ?? 0))}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      await supabase.from("traders").update({ is_public: !trader.is_public }).eq("id", trader.id);
                      qc.invalidateQueries({ queryKey: ["my-trader"] });
                      toast.success(`Perfil agora é ${!trader.is_public ? "público" : "privado"}`);
                    }}
                  >
                    Tornar {trader.is_public ? "Privado" : "Público"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
