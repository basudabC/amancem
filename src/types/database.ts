// ============================================================
// AMAN CEMENT CRM — Supabase Database Types
// ============================================================

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
          employee_code: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: 'sales_rep' | 'supervisor' | 'area_manager' | 'regional_manager' | 'country_head';
          avatar_url: string | null;
          reports_to: string | null;
          territory_ids: string[] | null;
          region: string | null;
          area: string | null;
          target_monthly: number | null;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_code: string;
          full_name: string;
          email: string;
          phone?: string | null;
          role?: 'sales_rep' | 'supervisor' | 'area_manager' | 'regional_manager' | 'country_head';
          avatar_url?: string | null;
          reports_to?: string | null;
          territory_ids?: string[] | null;
          region?: string | null;
          area?: string | null;
          target_monthly?: number | null;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_code?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          role?: 'sales_rep' | 'supervisor' | 'area_manager' | 'regional_manager' | 'country_head';
          avatar_url?: string | null;
          reports_to?: string | null;
          territory_ids?: string[] | null;
          region?: string | null;
          area?: string | null;
          target_monthly?: number | null;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      territories: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          level: number;
          boundary: Json | null;
          color_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          parent_id?: string | null;
          level: number;
          boundary?: Json | null;
          color_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          parent_id?: string | null;
          level?: number;
          boundary?: Json | null;
          color_key?: string;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          pipeline: 'recurring' | 'one_time';
          name: string;
          owner_name: string | null;
          phone: string | null;
          latitude: number;
          longitude: number;
          area: string | null;
          territory_id: string;
          sales_rep_id: string;
          status: 'active' | 'archived';
          pipeline_data: Json;
          last_outcome: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pipeline: 'recurring' | 'one_time';
          name: string;
          owner_name?: string | null;
          phone?: string | null;
          latitude: number;
          longitude: number;
          area?: string | null;
          territory_id: string;
          sales_rep_id: string;
          status?: 'active' | 'archived';
          pipeline_data: Json;
          last_outcome?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pipeline?: 'recurring' | 'one_time';
          name?: string;
          owner_name?: string | null;
          phone?: string | null;
          latitude?: number;
          longitude?: number;
          area?: string | null;
          territory_id?: string;
          sales_rep_id?: string;
          status?: 'active' | 'archived';
          pipeline_data?: Json;
          last_outcome?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      visits: {
        Row: {
          id: string;
          customer_id: string;
          sales_rep_id: string;
          checkin_lat: number | null;
          checkin_lng: number | null;
          checkin_at: string | null;
          outcome: string | null;
          note: string | null;
          voice_memo_url: string | null;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          sales_rep_id: string;
          checkin_lat?: number | null;
          checkin_lng?: number | null;
          checkin_at?: string | null;
          outcome?: string | null;
          note?: string | null;
          voice_memo_url?: string | null;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          sales_rep_id?: string;
          checkin_lat?: number | null;
          checkin_lng?: number | null;
          checkin_at?: string | null;
          outcome?: string | null;
          note?: string | null;
          voice_memo_url?: string | null;
          completed?: boolean;
          created_at?: string;
        };
      };
      route_plans: {
        Row: {
          id: string;
          sales_rep_id: string;
          plan_date: string;
          stops: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          sales_rep_id: string;
          plan_date: string;
          stops: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          sales_rep_id?: string;
          plan_date?: string;
          stops?: Json;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          sales_rep_id: string;
          date: string;
          day_start_at: string | null;
          day_start_lat: number | null;
          day_start_lng: number | null;
          day_end_at: string | null;
          day_end_lat: number | null;
          day_end_lng: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sales_rep_id: string;
          date: string;
          day_start_at?: string | null;
          day_start_lat?: number | null;
          day_start_lng?: number | null;
          day_end_at?: string | null;
          day_end_lat?: number | null;
          day_end_lng?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sales_rep_id?: string;
          date?: string;
          day_start_at?: string | null;
          day_start_lat?: number | null;
          day_start_lng?: number | null;
          day_end_at?: string | null;
          day_end_lat?: number | null;
          day_end_lng?: number | null;
          created_at?: string;
        };
      };
      location_pings: {
        Row: {
          id: string;
          sales_rep_id: string;
          latitude: number;
          longitude: number;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sales_rep_id: string;
          latitude: number;
          longitude: number;
          recorded_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          sales_rep_id?: string;
          latitude?: number;
          longitude?: number;
          recorded_at?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
