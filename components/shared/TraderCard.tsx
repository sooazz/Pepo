import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PerformanceChart } from "./PerformanceChart";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Users, TrendingUp } from "lucide-react";
import type { TraderWithStats } from "@/types";

interface TraderCardProps {
  trader: TraderWithStats;
}

function generateMockCurve(roi: number) {
  return Array.from({ length: 12 }, (_, i) => ({
    date: `${i + 1}`,
    value: 1000 * (1 + (roi / 100) * i * (0.8 + Math.random() * 0.4)),
  }));
}

export function TraderCard({ trader }: TraderCardProps) {
  const stats = trader.trader_stats;
  const minPrice = Math.min(...(trader.plans?.map((p) => p.price) ?? [0]));
  const roi = stats?.roi_monthly ?? 0;
  const curve = generateMockCurve(roi);

  return (
    <Card className="border-border/50 bg-card/80 hover:border-primary/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <Avatar>
            <AvatarFallback className="bg-primary/20 text-primary">
              {trader.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{trader.display_name}</p>
            <div className="flex items-center gap-2 mt-1">
              {trader.verified && (
                <Badge variant="secondary" className="text-xs py-0">Verificado</Badge>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                {stats?.followers_count ?? 0}
              </div>
            </div>
          </div>
        </div>

        <div className="h-10 mb-4">
          <PerformanceChart data={curve} mini />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">ROI Mensal</p>
            <p className={`font-semibold text-sm ${roi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatPercent(roi)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="font-semibold text-sm">{(stats?.win_rate ?? 0).toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Drawdown</p>
            <p className="font-semibold text-sm text-amber-400">
              {formatPercent(-(stats?.drawdown ?? 0))}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">A partir de</span>
            <span className="font-semibold">{formatCurrency(minPrice)}</span>
          </div>
          <Link href={`/traders/${trader.id}`}>
            <Button size="sm" variant="outline">Ver Trader</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
