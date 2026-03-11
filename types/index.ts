import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Trader = Database["public"]["Tables"]["traders"]["Row"];
export type TraderStats = Database["public"]["Tables"]["trader_stats"]["Row"];
export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type CopySettings = Database["public"]["Tables"]["copy_settings"]["Row"];
export type Trade = Database["public"]["Tables"]["trades"]["Row"];
export type CopiedTrade = Database["public"]["Tables"]["copied_trades"]["Row"];
export type Withdrawal = Database["public"]["Tables"]["withdrawals"]["Row"];

export type TraderWithStats = Trader & {
  trader_stats: TraderStats | null;
  plans: Plan[];
};

export type SubscriptionWithDetails = Subscription & {
  trader: Trader;
  plan: Plan;
};
