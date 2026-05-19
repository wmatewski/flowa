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
      sessions: {
        Row: {
          id: string;
          organization_id: string;
          slug: string;
          name: string;
          description: string;
          screen_time_limit_minutes: number;
          age_mode: Database["public"]["Enums"]["age_mode"];
          fixed_age: number | null;
          age_recommendations_enabled: boolean;
          age_recommendations: Json;
          status: Database["public"]["Enums"]["session_status"];
          created_by: string;
          starts_at: string;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          slug: string;
          name: string;
          description?: string;
          screen_time_limit_minutes?: number;
          age_mode?: Database["public"]["Enums"]["age_mode"];
          fixed_age?: number | null;
          age_recommendations_enabled?: boolean;
          age_recommendations?: Json;
          status?: Database["public"]["Enums"]["session_status"];
          created_by: string;
          starts_at?: string;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          slug?: string;
          name?: string;
          description?: string;
          screen_time_limit_minutes?: number;
          age_mode?: Database["public"]["Enums"]["age_mode"];
          fixed_age?: number | null;
          age_recommendations_enabled?: boolean;
          age_recommendations?: Json;
          status?: Database["public"]["Enums"]["session_status"];
          created_by?: string;
          starts_at?: string;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      session_submissions: {
        Row: {
          id: string;
          session_id: string;
          participant_key: string;
          age: number;
          screen_time_minutes: number;
          detected_os: Database["public"]["Enums"]["os_family"];
          ip_address: string | null;
          entered_at: string | null;
          client_metadata: Json;
          user_agent: string | null;
          submitted_at: string;
          entry_date: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          participant_key: string;
          age: number;
          screen_time_minutes: number;
          detected_os?: Database["public"]["Enums"]["os_family"];
          ip_address?: string | null;
          entered_at?: string | null;
          client_metadata?: Json;
          user_agent?: string | null;
          submitted_at?: string;
          entry_date?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          participant_key?: string;
          age?: number;
          screen_time_minutes?: number;
          detected_os?: Database["public"]["Enums"]["os_family"];
          ip_address?: string | null;
          entered_at?: string | null;
          client_metadata?: Json;
          user_agent?: string | null;
          submitted_at?: string;
          entry_date?: string;
        };
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: number;
          organization_id: string;
          session_id: string | null;
          actor_user_id: string | null;
          activity_type: string;
          title: string;
          description: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          organization_id: string;
          session_id?: string | null;
          actor_user_id?: string | null;
          activity_type: string;
          title: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: number;
          organization_id?: string;
          session_id?: string | null;
          actor_user_id?: string | null;
          activity_type?: string;
          title?: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      latest_session_participants: {
        Row: {
          id: string;
          session_id: string;
          participant_key: string;
          age: number;
          screen_time_minutes: number;
          detected_os: Database["public"]["Enums"]["os_family"];
          ip_address: string | null;
          entered_at: string | null;
          client_metadata: Json;
          user_agent: string | null;
          submitted_at: string;
          entry_date: string;
        };
        Insert: {
          id?: string;
          session_id?: string;
          participant_key?: string;
          age?: number;
          screen_time_minutes?: number;
          detected_os?: Database["public"]["Enums"]["os_family"];
          ip_address?: string | null;
          entered_at?: string | null;
          client_metadata?: Json;
          user_agent?: string | null;
          submitted_at?: string;
          entry_date?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          participant_key?: string;
          age?: number;
          screen_time_minutes?: number;
          detected_os?: Database["public"]["Enums"]["os_family"];
          ip_address?: string | null;
          entered_at?: string | null;
          client_metadata?: Json;
          user_agent?: string | null;
          submitted_at?: string;
          entry_date?: string;
        };
        Relationships: [];
      };
      session_age_statistics: {
        Row: {
          session_id: string;
          age_bucket: string;
          participants: number;
          average_minutes: number;
          maximum_minutes: number;
        };
        Insert: {
          session_id?: string;
          age_bucket?: string;
          participants?: number;
          average_minutes?: number;
          maximum_minutes?: number;
        };
        Update: {
          session_id?: string;
          age_bucket?: string;
          participants?: number;
          average_minutes?: number;
          maximum_minutes?: number;
        };
        Relationships: [];
      };
      session_overview: {
        Row: {
          session_id: string;
          organization_id: string;
          slug: string;
          name: string;
          status: Database["public"]["Enums"]["session_status"];
          screen_time_limit_minutes: number;
          created_at: string;
          starts_at: string;
          ends_at: string | null;
          participant_count: number;
          average_minutes: number | null;
          maximum_minutes: number | null;
          latest_submission_at: string | null;
        };
        Insert: {
          session_id?: string;
          organization_id?: string;
          slug?: string;
          name?: string;
          status?: Database["public"]["Enums"]["session_status"];
          screen_time_limit_minutes?: number;
          created_at?: string;
          starts_at?: string;
          ends_at?: string | null;
          participant_count?: number;
          average_minutes?: number | null;
          maximum_minutes?: number | null;
          latest_submission_at?: string | null;
        };
        Update: {
          session_id?: string;
          organization_id?: string;
          slug?: string;
          name?: string;
          status?: Database["public"]["Enums"]["session_status"];
          screen_time_limit_minutes?: number;
          created_at?: string;
          starts_at?: string;
          ends_at?: string | null;
          participant_count?: number;
          average_minutes?: number | null;
          maximum_minutes?: number | null;
          latest_submission_at?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      os_family: "ios" | "android" | "windows" | "macos" | "linux" | "unknown";
      membership_role: "owner" | "admin" | "moderator";
      membership_status: "invited" | "active" | "disabled";
      session_status: "draft" | "active" | "completed";
      age_mode: "fixed" | "variable";
    };
    CompositeTypes: Record<string, never>;
  };
}
