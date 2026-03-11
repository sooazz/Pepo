"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TraderCard } from "@/components/shared/TraderCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTraders, type TraderFilters } from "@/hooks/useTraders";
import { Search, SlidersHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PerformanceChart } from "@/components/shared/PerformanceChart";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MARKETS = ["Futebol", "Tênis", "Basquete", "Xadrez", "E-Sports"];

function generateMockCurve(roi: number) {
  return Array.from({ length: 10 }, (_, i) => ({
    date: `${i + 1}`,
    value: 1000 * (1 + (roi / 100) * i * (0.8 + Math.random() * 0.4)),
  }));
}

export default function TradersPage() {
  const [filters, setFilters] = useState<TraderFilters>({});
  const [search, setSearch] = useState("");
  const { data: traders = [], isLoading } = useTraders({ ...filters, search: search || undefined });

  function setFilter<K extends keyof TraderFilters>(key: K, value: TraderFilters[K]) {
    setFilters((p) => ({ ...p, [key]: value }));
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Marketplace de Traders</h1>
          <p className="text-muted-foreground mt-1">Encontre os melhores traders esportivos e comece a copiar</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar trader..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select onValueChange={(v) => setFilter("market", v === "todos" ? undefined : v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Mercado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {MARKETS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => setFilter("minRoi", v === "0" ? undefined : Number(v))}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="ROI mínimo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Qualquer ROI</SelectItem>
              <SelectItem value="5">+5% ao mês</SelectItem>
              <SelectItem value="10">+10% ao mês</SelectItem>
              <SelectItem value="20">+20% ao mês</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => setFilter("maxDrawdown", v === "100" ? undefined : Number(v))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Drawdown máx." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">Qualquer drawdown</SelectItem>
              <SelectItem value="10">Máx. 10%</SelectItem>
              <SelectItem value="20">Máx. 20%</SelectItem>
              <SelectItem value="30">Máx. 30%</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="w-4 h-4" />
            {traders.length} traders encontrados
          </div>
        </div>

        <Tabs defaultValue="cards">
          <TabsList>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="table">Tabela</TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 rounded-xl" />
                ))}
              </div>
            ) : traders.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                Nenhum trader encontrado com os filtros selecionados
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {traders.map((trader) => (
                  <TraderCard key={trader.id} trader={trader} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="table" className="mt-4">
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Trader</TableHead>
                    <TableHead className="text-right">ROI Diário</TableHead>
                    <TableHead className="text-right">ROI Semanal</TableHead>
                    <TableHead className="text-right">ROI Mensal</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                    <TableHead className="text-right">Drawdown</TableHead>
                    <TableHead className="text-right">Trades</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : traders.map((trader) => {
                    const s = trader.trader_stats;
                    const curve = generateMockCurve(s?.roi_monthly ?? 0);
                    return (
                      <TableRow key={trader.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div>
                            <p className="font-medium">{trader.display_name}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {trader.markets?.slice(0, 2).map((m) => (
                                <Badge key={m} variant="secondary" className="text-xs py-0">{m}</Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${(s?.roi_daily ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {formatPercent(s?.roi_daily ?? 0)}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${(s?.roi_weekly ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {formatPercent(s?.roi_weekly ?? 0)}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${(s?.roi_monthly ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {formatPercent(s?.roi_monthly ?? 0)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {(s?.win_rate ?? 0).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-amber-400">
                          {formatPercent(-(s?.drawdown ?? 0))}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {s?.total_trades ?? 0}
                        </TableCell>
                        <TableCell className="w-24">
                          <PerformanceChart data={curve} mini />
                        </TableCell>
                        <TableCell>
                          <Link href={`/traders/${trader.id}`}>
                            <Button size="sm" variant="outline">Ver</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
