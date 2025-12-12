export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      paused_items: {
        Row: {
          created_at: string
          emotion: string | null
          id: string
          image_url: string | null
          individual_reminder_sent_at: string | null
          is_cart: boolean | null
          item_type: string | null
          notes: string | null
          other_duration: string | null
          pause_duration_days: number
          price: number | null
          reason: string | null
          review_at: string
          shared_with_partners: string[] | null
          status: string
          store_name: string | null
          tags: string[] | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          emotion?: string | null
          id?: string
          image_url?: string | null
          individual_reminder_sent_at?: string | null
          is_cart?: boolean | null
          item_type?: string | null
          notes?: string | null
          other_duration?: string | null
          pause_duration_days?: number
          price?: number | null
          reason?: string | null
          review_at: string
          shared_with_partners?: string[] | null
          status?: string
          store_name?: string | null
          tags?: string[] | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          emotion?: string | null
          id?: string
          image_url?: string | null
          individual_reminder_sent_at?: string | null
          is_cart?: boolean | null
          item_type?: string | null
          notes?: string | null
          other_duration?: string | null
          pause_duration_days?: number
          price?: number | null
          reason?: string | null
          review_at?: string
          shared_with_partners?: string[] | null
          status?: string
          store_name?: string | null
          tags?: string[] | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          endpoint: string | null
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint?: string | null
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          requests_count: number | null
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          requests_count?: number | null
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          requests_count?: number | null
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          started_at: string
          status: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          color_theme: string | null
          created_at: string
          email_batching_enabled: boolean | null
          id: string
          last_reminder_sent: string | null
          monthly_usage_count: number | null
          notification_batch_window: number | null
          notification_delivery_style: string | null
          notification_profile: string | null
          notification_schedule_type: string | null
          notification_time_preference: string | null
          notification_timing: string | null
          notification_timing_hour: number | null
          notifications_enabled: boolean
          platform: string | null
          push_token: string | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          theme: string
          timezone: string | null
          updated_at: string
          usage_month: number | null
          usage_year: number | null
          user_id: string
          values_selected: string[] | null
          values_setup_completed: boolean | null
        }
        Insert: {
          color_theme?: string | null
          created_at?: string
          email_batching_enabled?: boolean | null
          id?: string
          last_reminder_sent?: string | null
          monthly_usage_count?: number | null
          notification_batch_window?: number | null
          notification_delivery_style?: string | null
          notification_profile?: string | null
          notification_schedule_type?: string | null
          notification_time_preference?: string | null
          notification_timing?: string | null
          notification_timing_hour?: number | null
          notifications_enabled?: boolean
          platform?: string | null
          push_token?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          theme?: string
          timezone?: string | null
          updated_at?: string
          usage_month?: number | null
          usage_year?: number | null
          user_id: string
          values_selected?: string[] | null
          values_setup_completed?: boolean | null
        }
        Update: {
          color_theme?: string | null
          created_at?: string
          email_batching_enabled?: boolean | null
          id?: string
          last_reminder_sent?: string | null
          monthly_usage_count?: number | null
          notification_batch_window?: number | null
          notification_delivery_style?: string | null
          notification_profile?: string | null
          notification_schedule_type?: string | null
          notification_time_preference?: string | null
          notification_timing?: string | null
          notification_timing_hour?: number | null
          notifications_enabled?: boolean
          platform?: string | null
          push_token?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          theme?: string
          timezone?: string | null
          updated_at?: string
          usage_month?: number | null
          usage_year?: number | null
          user_id?: string
          values_selected?: string[] | null
          values_setup_completed?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          endpoint_name: string
          max_requests?: number
          window_minutes?: number
        }
        Returns: boolean
      }
      get_current_user_email: { Args: never; Returns: string }
      get_subscription_tier: { Args: { user_uuid?: string }; Returns: string }
      get_user_partners: {
        Args: { user_uuid?: string }
        Returns: {
          partner_email: string
          partner_id: string
          partner_name: string
        }[]
      }
      get_user_subscription_tier: {
        Args: { user_uuid?: string }
        Returns: string
      }
      has_pause_partner_access: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      reset_monthly_usage: { Args: never; Returns: undefined }
      send_test_push_notification: {
        Args: { target_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
