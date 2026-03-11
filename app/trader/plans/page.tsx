"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db as supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import type { Plan } from "@/types";

const MARKETS = ["Futebol", "Tênis", "Basquete", "Xadrez", "E-Sports"];

const PLAN_DEFAULTS = { name: "", price: 100, max_stake: 100, max_followers: 50, is_public: true, markets: [] as string[] };

function PlanForm({
  initial,
  onSave,
  loading,
}: {
  initial: typeof PLAN_DEFAULTS;
  onSave: (v: typeof PLAN_DEFAULTS) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState(initial);
  function set<K extends keyof typeof PLAN_DEFAULTS>(k: K, v: (typeof PLAN_DEFAULTS)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }
  function toggleMarket(m: string) {
    set("markets", form.markets.includes(m) ? form.markets.filter((x) => x !== m) : [...form.markets, m]);
  }
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Plano</Label>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Starter, Pro, Elite" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Preço Mensal (R$)</Label>
          <Input type="number" min={0} value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Stake Máxima (R$)</Label>
          <Input type="number" min={0} value={form.max_stake} onChange={(e) => set("max_stake", Number(e.target.value))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Máx. Seguidores</Label>
        <Input type="number" min={1} value={form.max_followers} onChange={(e) => set("max_followers", Number(e.target.value))} />
      </div>
      <div className="space-y-2">
        <Label>Mercados Permitidos</Label>
        <div className="flex flex-wrap gap-2">
          {MARKETS.map((m) => {
            const active = form.markets.includes(m);
            return (
              <button key={m} type="button" onClick={() => toggleMarket(m)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${active ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                {m}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Label>Plano Público</Label>
        <button type="button" onClick={() => set("is_public", !form.is_public)}
          className={`w-10 h-5 rounded-full transition-colors ${form.is_public ? "bg-primary" : "bg-muted"} relative`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.is_public ? "left-5" : "left-0.5"}`} />
        </button>
      </div>
      <Button className="w-full" onClick={() => onSave(form)} disabled={loading || !form.name}>
        {loading ? "Salvando..." : "Salvar Plano"}
      </Button>
    </div>
  );
}

export default function TraderPlansPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);

  const { data: trader } = useQuery({
    queryKey: ["my-trader-id", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("traders").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["my-plans", trader?.id],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").eq("trader_id", trader!.id).order("price");
      return (data ?? []) as Plan[];
    },
    enabled: !!trader?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (form: typeof PLAN_DEFAULTS) => {
      if (!trader?.id) throw new Error("Trader não encontrado");
      if (editing) {
        const { error } = await supabase.from("plans").update({ ...form }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("plans").insert({ ...form, trader_id: trader.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-plans"] });
      toast.success(editing ? "Plano atualizado!" : "Plano criado!");
      setOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-plans"] }); toast.success("Plano removido"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Meus Planos</h1>
            <p className="text-muted-foreground mt-1">Crie e gerencie os planos de assinatura para seus seguidores</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />Novo Plano</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar Plano" : "Criar Plano"}</DialogTitle>
              </DialogHeader>
              <PlanForm
                initial={editing ? {
                  name: editing.name,
                  price: editing.price,
                  max_stake: editing.max_stake,
                  max_followers: editing.max_followers,
                  is_public: editing.is_public,
                  markets: editing.markets,
                } : PLAN_DEFAULTS}
                onSave={(v) => saveMutation.mutate(v)}
                loading={saveMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {plans.length === 0 ? (
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-12 text-center text-muted-foreground">
              Nenhum plano criado ainda. Clique em &quot;Novo Plano&quot; para começar.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="border-border/50 bg-card/80">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { setEditing(plan); setOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => deleteMutation.mutate(plan.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{formatCurrency(plan.price)}</span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                    <Badge variant={plan.is_public ? "default" : "secondary"} className="ml-auto">
                      {plan.is_public ? "Público" : "Privado"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stake máxima</span>
                    <span className="font-mono">{formatCurrency(plan.max_stake)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Máx. seguidores</span>
                    <span className="font-mono">{plan.max_followers}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {plan.markets?.map((m) => (
                      <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
