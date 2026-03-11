"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { db as supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, Plus, X } from "lucide-react";
import type { CopySettings } from "@/types";

const MARKETS = ["Futebol", "Tênis", "Basquete", "Xadrez", "E-Sports"];

const DEFAULT: Partial<CopySettings> = {
  stake_type: "fixed",
  stake_value: 50,
  max_daily_risk: 500,
  max_simultaneous_trades: 3,
  slippage_ticks: 2,
  force_entry_ticks: 1,
  allowed_markets: [],
  is_active: true,
};

export default function CopySettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Partial<CopySettings>>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("copy_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data);
        setLoading(false);
      });
  }, [user]);

  function set<K extends keyof CopySettings>(key: K, value: CopySettings[K]) {
    setSettings((p) => ({ ...p, [key]: value }));
  }

  function toggleMarket(market: string) {
    const markets = settings.allowed_markets ?? [];
    if (markets.includes(market)) {
      set("allowed_markets", markets.filter((m) => m !== market));
    } else {
      set("allowed_markets", [...markets, market]);
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const payload = { ...settings, user_id: user.id };

    const { error } = settings.id
      ? await supabase.from("copy_settings").update(payload).eq("id", settings.id!)
      : await supabase.from("copy_settings").insert(payload as CopySettings);

    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Configurações salvas!");
    setSaving(false);
  }

  if (loading) return (
    <AppLayout>
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações de Copy</h1>
          <p className="text-muted-foreground mt-1">Defina como os trades serão copiados automaticamente</p>
        </div>

        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Stake</CardTitle>
            <CardDescription>Como calcular o valor de cada aposta copiada</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Stake</Label>
              <Select
                value={settings.stake_type}
                onValueChange={(v) => set("stake_type", v as "fixed" | "percentage")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                  <SelectItem value="percentage">Percentual da banca (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {settings.stake_type === "percentage" ? "Percentual (%)" : "Valor (R$)"}
              </Label>
              <Input
                type="number"
                min={0}
                value={settings.stake_value ?? ""}
                onChange={(e) => set("stake_value", Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Gerenciamento de Risco</CardTitle>
            <CardDescription>Limites de proteção da sua banca</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Risco máximo diário (R$)</Label>
              <Input
                type="number"
                min={0}
                value={settings.max_daily_risk ?? ""}
                onChange={(e) => set("max_daily_risk", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Máx. trades simultâneos</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={settings.max_simultaneous_trades ?? ""}
                onChange={(e) => set("max_simultaneous_trades", Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Configurações de Execução</CardTitle>
            <CardDescription>Parâmetros para execução de ordens na Betfair</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Slippage (ticks)</Label>
              <Input
                type="number"
                min={0}
                value={settings.slippage_ticks ?? ""}
                onChange={(e) => set("slippage_ticks", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Aceitação máxima de piora de odds</p>
            </div>
            <div className="space-y-2">
              <Label>Forçar entrada (ticks)</Label>
              <Input
                type="number"
                min={0}
                value={settings.force_entry_ticks ?? ""}
                onChange={(e) => set("force_entry_ticks", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Ticks para forçar entrada em mercado</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Mercados Permitidos</CardTitle>
            <CardDescription>Selecione os mercados que deseja copiar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {MARKETS.map((market) => {
                const active = (settings.allowed_markets ?? []).includes(market);
                return (
                  <button
                    key={market}
                    onClick={() => toggleMarket(market)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      active
                        ? "bg-primary/20 border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    {active ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {market}
                  </button>
                );
              })}
            </div>
            {(settings.allowed_markets ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">Nenhum mercado selecionado = todos os mercados</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
