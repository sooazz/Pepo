"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Check } from "lucide-react";
import type { Plan } from "@/types";

interface SubscriptionPlanCardProps {
  plan: Plan;
  onSubscribe?: (planId: string) => void;
  isSubscribed?: boolean;
  loading?: boolean;
}

export function SubscriptionPlanCard({ plan, onSubscribe, isSubscribed, loading }: SubscriptionPlanCardProps) {
  return (
    <Card className={`border-border/50 bg-card/80 flex flex-col ${isSubscribed ? "border-primary/50" : ""}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          {isSubscribed && <Badge className="bg-primary/20 text-primary">Ativo</Badge>}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
          <span className="text-muted-foreground text-sm">/mês</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Stake máxima: <strong>{formatCurrency(plan.max_stake)}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Até <strong>{plan.max_followers}</strong> seguidores</span>
        </div>
        {plan.markets?.map((m) => (
          <div key={m} className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{m}</span>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        {onSubscribe && (
          <Button
            className="w-full"
            onClick={() => onSubscribe(plan.id)}
            disabled={isSubscribed || loading}
            variant={isSubscribed ? "secondary" : "default"}
          >
            {isSubscribed ? "Plano Ativo" : "Assinar Plano"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
