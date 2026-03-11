"use client";

import { use, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useTrader, useTraderTrades } from "@/hooks/useTraders";
import { PerformanceChart } from "@/components/shared/PerformanceChart";
import { SubscriptionPlanCard } from "@/components/shared/SubscriptionPlanCard";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { db as supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatPercent, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { TrendingUp, Users, Target, ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function generateCurve(roi: number) {
  let val = 1000;
  return Array.from({ length: 30 }, (_, i) => {
    val *= 1 + (roi / 100) * (0.7 + Math.random() * 0.6) / 30;
    return { date: `D${i + 1}`, value: val };
  });
}

export default function TraderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { data: trader, isLoading } = useTrader(id);
  const { data: trades = [] } = useTraderTrades(id);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [subscribedPlan, setSubscribedPlan] = useState<string | null>(null);

  async function handleSubscribe(planId: string) {
    if (!user) { toast.error("Faça login para assinar"); return; }
    setSubscribing(planId);
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);
    const { error } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      trader_id: id,
      plan_id: planId,
      status: "active",
      renewal_date: renewalDate.toISOString(),
    });
    if (error) toast.error("Erro ao assinar: " + error.message);
    else { toast.success("Assinatura realizada!"); setSubscribedPlan(planId); }
    setSubscribing(null);
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!trader) return (
    <AppLayout>
      <div className="p-6 text-muted-foreground">Trader não encontrado.</div>
    </AppLayout>
  );

  const s = trader.trader_stats;
  const curve = generateCurve(s?.roi_monthly ?? 5);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <Link href="/traders" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Marketplace
        </Link>

        {/* Header do Trader */}
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                  {trader.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{trader.display_name}</h1>
                  {trader.verified && (
                    <div className="flex items-center gap-1 text-primary text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verificado</span>
                    </div>
                  )}
                  <Badge variant={
                    trader.copy_status === "ACTIVE" ? "default" :
                    trader.copy_status === "PAUSING" ? "secondary" : "destructive"
                  }>
                    {trader.copy_status}
                  </Badge>
                </div>
                {trader.bio && <p className="text-muted-foreground mt-2">{trader.bio}</p>}
                {trader.strategy && (
                  <p className="text-sm mt-2">
                    <span className="text-muted-foreground">Estratégia: </span>{trader.strategy}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {trader.markets?.map((m) => (
                    <Badge key={m} variant="secondary">{m}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="w-4 h-4" />
                {s?.followers_count ?? 0} seguidores
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="ROI Mensal" value={formatPercent(s?.roi_monthly ?? 0)} icon={TrendingUp}
            trend={(s?.roi_monthly ?? 0) >= 0 ? "up" : "down"} />
          <StatCard title="Win Rate" value={`${(s?.win_rate ?? 0).toFixed(1)}%`} icon={Target} />
          <StatCard title="Drawdown" value={formatPercent(-(s?.drawdown ?? 0))} icon={ShieldAlert} trend="down" />
          <StatCard title="Lucro Total" value={formatCurrency(s?.total_profit ?? 0)} icon={TrendingUp}
            trend={(s?.total_profit ?? 0) >= 0 ? "up" : "down"} />
        </div>

        <Tabs defaultValue="curve">
          <TabsList>
            <TabsTrigger value="curve">Curva de Capital</TabsTrigger>
            <TabsTrigger value="trades">Histórico de Trades</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
          </TabsList>

          <TabsContent value="curve" className="mt-4">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Curva de Capital (30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceChart data={curve} height={280} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trades" className="mt-4">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Últimos Trades</CardTitle>
              </CardHeader>
              <CardContent>
                {trades.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum trade registrado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evento</TableHead>
                        <TableHead>Mercado</TableHead>
                        <TableHead>Seleção</TableHead>
                        <TableHead className="text-right">Odds</TableHead>
                        <TableHead className="text-right">Stake</TableHead>
                        <TableHead className="text-right">Resultado</TableHead>
                        <TableHead className="text-right">Lucro</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell className="font-medium">{trade.event}</TableCell>
                          <TableCell><Badge variant="secondary">{trade.market}</Badge></TableCell>
                          <TableCell>{trade.selection}</TableCell>
                          <TableCell className="text-right font-mono">{trade.odds.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(trade.stake)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={trade.result === "win" ? "default" : trade.result === "loss" ? "destructive" : "secondary"}>
                              {trade.result ?? "aberto"}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-mono ${(trade.profit ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {trade.profit != null ? formatCurrency(trade.profit) : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(trade.opened_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="mt-4">
            {trader.plans?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum plano disponível</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trader.plans?.map((plan) => (
                  <SubscriptionPlanCard
                    key={plan.id}
                    plan={plan}
                    onSubscribe={handleSubscribe}
                    isSubscribed={subscribedPlan === plan.id}
                    loading={subscribing === plan.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
