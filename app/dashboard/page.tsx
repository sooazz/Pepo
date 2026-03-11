"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/shared/StatCard";
import { PerformanceChart } from "@/components/shared/PerformanceChart";
import { useAuth } from "@/hooks/useAuth";
import { useUserDashboard } from "@/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent, formatDateTime } from "@/lib/utils";
import { TrendingUp, Copy, CheckCircle2, XCircle, Percent, BarChart3 } from "lucide-react";

function buildCapitalCurve(trades: { profit: number | null; created_at: string }[]) {
  let acc = 0;
  return trades
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((t) => {
      acc += t.profit ?? 0;
      return {
        date: new Date(t.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        value: acc,
      };
    });
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { data, isLoading } = useUserDashboard(user?.id ?? "");

  const capitalCurve = data?.trades ? buildCapitalCurve(data.trades) : [];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            Olá, {profile?.full_name?.split(" ")[0] ?? "usuário"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Acompanhe seu desempenho em copy trading</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          ) : (
            <>
              <StatCard title="Lucro Total" value={formatCurrency(data?.totalProfit ?? 0)}
                icon={TrendingUp} trend={(data?.totalProfit ?? 0) >= 0 ? "up" : "down"}
                className="col-span-2 md:col-span-1" />
              <StatCard title="ROI" value={formatPercent(data?.roi ?? 0)}
                icon={Percent} trend={(data?.roi ?? 0) >= 0 ? "up" : "down"} />
              <StatCard title="Trades Copiados" value={String(data?.totalCopied ?? 0)}
                icon={Copy} />
              <StatCard title="Executados" value={String(data?.executed ?? 0)}
                icon={CheckCircle2} />
              <StatCard title="Não Seguidos" value={String(data?.skipped ?? 0)}
                icon={XCircle} />
              <StatCard title="Win Rate" value={`${(data?.winRate ?? 0).toFixed(1)}%`}
                icon={BarChart3} />
            </>
          )}
        </div>

        {/* Curva de Capital */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Curva de Capital</CardTitle>
          </CardHeader>
          <CardContent>
            {capitalCurve.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
                Nenhum trade registrado ainda. Assine um trader no{" "}
                <a href="/traders" className="text-primary ml-1 hover:underline">Marketplace</a>.
              </div>
            ) : (
              <PerformanceChart data={capitalCurve} height={260} />
            )}
          </CardContent>
        </Card>

        {/* Histórico de Trades Copiados */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Últimos Trades Copiados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
              </div>
            ) : (data?.trades ?? []).length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">Nenhum trade copiado ainda</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Odds</TableHead>
                    <TableHead className="text-right">Stake</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead className="text-right">Resultado</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.trades ?? []).slice(0, 20).map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>
                        <Badge variant={trade.status === "copied" ? "default" : trade.status === "skipped" ? "secondary" : "destructive"}>
                          {trade.status === "copied" ? "Copiado" : trade.status === "skipped" ? "Pulado" : "Falhou"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{trade.odds.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(trade.stake)}</TableCell>
                      <TableCell className={`text-right font-mono ${(trade.profit ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {trade.profit != null ? formatCurrency(trade.profit) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {trade.result ? (
                          <Badge variant={trade.result === "win" ? "default" : trade.result === "loss" ? "destructive" : "secondary"}>
                            {trade.result}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDateTime(trade.created_at)}</TableCell>
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
