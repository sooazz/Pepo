export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "user" | "trader" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      traders: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          bio: string | null;
          strategy: string | null;
          avatar_url: string | null;
          is_public: boolean;
          copy_status: "ACTIVE" | "PAUSING" | "OFF";
          markets: string[];
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["traders"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["traders"]["Insert"]>;
      };
      trader_stats: {
        Row: {
          id: string;
          trader_id: string;
          roi_daily: number;
          roi_weekly: number;
          roi_monthly: number;
          total_profit: number;
          drawdown: number;
          win_rate: number;
          total_trades: number;
          followers_count: number;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["trader_stats"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["trader_stats"]["Insert"]>;
      };
      plans: {
        Row: {
          id: string;
          trader_id: string;
          name: string;
          price: number;
          max_stake: number;
          max_followers: number;
          is_public: boolean;
          markets: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["plans"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          trader_id: string;
          plan_id: string;
          status: "active" | "cancelled" | "expired";
          renewal_date: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      copy_settings: {
        Row: {
          id: string;
          user_id: string;
          trader_id: string;
          stake_type: "fixed" | "percentage";
          stake_value: number;
          max_daily_risk: number;
          max_simultaneous_trades: number;
          slippage_ticks: number;
          force_entry_ticks: number;
          allowed_markets: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["copy_settings"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["copy_settings"]["Insert"]>;
      };
      trades: {
        Row: {
          id: string;
          trader_id: string;
          market: string;
          event: string;
          selection: string;
          odds: number;
          stake: number;
          result: "win" | "loss" | "void" | null;
          profit: number | null;
          status: "open" | "closed" | "cancelled";
          opened_at: string;
          closed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["trades"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["trades"]["Insert"]>;
      };
      copied_trades: {
        Row: {
          id: string;
          user_id: string;
          original_trade_id: string;
          trader_id: string;
          stake: number;
          odds: number;
          result: "win" | "loss" | "void" | null;
          profit: number | null;
          status: "copied" | "skipped" | "failed";
          reason_skipped: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["copied_trades"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["copied_trades"]["Insert"]>;
      };
      withdrawals: {
        Row: {
          id: string;
          trader_id: string;
          amount: number;
          status: "pending" | "processing" | "paid";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["withdrawals"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["withdrawals"]["Insert"]>;
      };
    };
  };
}
