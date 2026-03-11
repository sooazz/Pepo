"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db as supabase } from "@/lib/supabase";
import { StatCard } from "@/components/shared/StatCard";
import { RevenueChart } from "@/components/shared/RevenueChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Users, Clock, ArrowDownToLine } from "lucide-react";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function TraderFinancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { data: trader } = useQuery({
    queryKey: ["my-trader-id", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("traders").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: finance, isLoading } = useQuery({
    queryKey: ["trader-finance", trader?.id],
    queryFn: async () => {
      const [subsRes, withdrawalsRes] = await Promise.all([
        supabase.from("subscriptions")
          .select("*, plans(price, name)")
          .eq("trader_id", trader!.id)
          .eq("status", "active"),
        supabase.from("withdrawals")
          .select("*")
          .eq("trader_id", trader!.id)
          .order("created_at", { ascending: false }),
      ]);

      const subs = subsRes.data ?? [];
      const withdrawals = withdrawalsRes.data ?? [];

      const monthlyRevenue = subs.reduce((s, sub) => {
        const p = sub.plans as unknown as { price: number } | null;
        return s + (p?.price ?? 0);
      }, 0);

      const paid = withdrawals.filter((w) => w.status === "paid").reduce((s, w) => s + w.amount, 0);
      const processing = withdrawals.filter((w) => w.status === "processing").reduce((s, w) => s + w.amount, 0);
      const pendingAmt = withdrawals.filter((w) => w.status === "pending").reduce((s, w) => s + w.amount, 0);
      const totalRevenue = monthlyRevenue * new Date().getMonth() + 1;
      const available = totalRevenue - paid - processing - pendingAmt;

      const byPlan = subs.reduce((acc: Record<string, { name: string; count: number; revenue: number }>, sub) => {
        const p = sub.plans as unknown as { price: number; name: string } | null;
        if (!p) return acc;
        if (!acc[p.name]) acc[p.name] = { name: p.name, count: 0, revenue: 0 };
        acc[p.name].count++;
        acc[p.name].revenue += p.price;
        return acc;
      }, {});

      return {
        monthlyRevenue,
        totalRevenue,
        activeSubscribers: subs.length,
        avgTicket: subs.length > 0 ? monthlyRevenue / subs.length : 0,
        available: Math.max(available, 0),
        pendingWithdrawals: pendingAmt,
        processingWithdrawals: processing,
        withdrawals,
        planBreakdown: Object.values(byPlan),
      };
    },
    enabled: !!trader?.id,
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!trader) throw new Error("Trader não encontrado");
      if (amount > (finance?.available ?? 0)) throw new Error("Saldo insuficiente");
      const { error } = await supabase.from("withdrawals").insert({
        trader_id: trader.id,
        amount,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trader-finance"] });
      toast.success("Solicitação de saque enviada!");
      setWithdrawOpen(false);
      setWithdrawAmount("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revenueData = MONTHS.slice(0, new Date().getMonth() + 1).map((month) => ({
    month,
    revenue: (finance?.monthlyRevenue ?? 0) * (0.7 + Math.random() * 0.6),
  }));

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Painel Financeiro</h1>
            <p className="text-muted-foreground mt-1">Acompanhe sua receita e gerencie saques</p>
          </div>
          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><ArrowDownToLine className="w-4 h-4" />Solicitar Saque</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Saque</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Saldo disponível</p>
                  <p className="text-2xl font-bold">{formatCurrency(finance?.available ?? 0)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Valor do saque (R$)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={finance?.available ?? 0}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => withdrawMutation.mutate(Number(withdrawAmount))}
                  disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || withdrawMutation.isPending}
                >
                  {withdrawMutation.isPending ? "Enviando..." : "Confirmar Saque"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Receita Mensal" value={formatCurrency(finance?.monthlyRevenue ?? 0)} icon={DollarSign} trend="up" />
            <StatCard title="Assinantes Ativos" value={String(finance?.activeSubscribers ?? 0)} icon={Users} />
            <StatCard title="Ticket Médio" value={formatCurrency(finance?.avgTicket ?? 0)} icon={TrendingUp} />
            <StatCard title="Saques Pendentes" value={formatCurrency(finance?.pendingWithdrawals ?? 0)} icon={Clock} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Saldo */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Saldo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-muted-foreground">Disponível</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(finance?.available ?? 0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-muted-foreground">Em processamento</p>
                <p className="text-xl font-bold text-amber-400">{formatCurrency(finance?.processingWithdrawals ?? 0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Saques pendentes</p>
                <p className="text-xl font-bold">{formatCurrency(finance?.pendingWithdrawals ?? 0)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Receita por Plano */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Receita por Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(finance?.planBreakdown ?? []).length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
              ) : finance?.planBreakdown.map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.count} assinante{p.count !== 1 ? "s" : ""}</p>
                  </div>
                  <p className="font-mono font-semibold">{formatCurrency(p.revenue)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Gráfico Receita */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Receita Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueData} height={150} />
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Saques */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Histórico de Saques</CardTitle>
          </CardHeader>
          <CardContent>
            {(finance?.withdrawals ?? []).length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">Nenhum saque realizado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finance?.withdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="text-muted-foreground">{formatDate(w.created_at)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{formatCurrency(w.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          w.status === "paid" ? "default" :
                          w.status === "processing" ? "secondary" : "outline"
                        }>
                          {w.status === "paid" ? "Pago" : w.status === "processing" ? "Processando" : "Pendente"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
