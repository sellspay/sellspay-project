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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      collection_items: {
        Row: {
          collection_id: string
          created_at: string
          display_order: number | null
          id: string
          product_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          product_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          cover_image_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          display_order: number | null
          id: string
          is_visible: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          gif_url: string | null
          id: string
          parent_comment_id: string | null
          product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          gif_url?: string | null
          id?: string
          parent_comment_id?: string | null
          product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          gif_url?: string | null
          id?: string
          parent_comment_id?: string | null
          product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      editor_applications: {
        Row: {
          about_me: string
          city: string
          country: string
          created_at: string | null
          display_name: string
          hourly_rate_cents: number
          id: string
          languages: string[]
          reviewed_at: string | null
          reviewed_by: string | null
          services: string[]
          social_links: Json | null
          starting_budget_cents: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          about_me: string
          city: string
          country: string
          created_at?: string | null
          display_name: string
          hourly_rate_cents: number
          id?: string
          languages: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          services: string[]
          social_links?: Json | null
          starting_budget_cents?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          about_me?: string
          city?: string
          country?: string
          created_at?: string | null
          display_name?: string
          hourly_rate_cents?: number
          id?: string
          languages?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          services?: string[]
          social_links?: Json | null
          starting_budget_cents?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      editor_bookings: {
        Row: {
          buyer_id: string
          created_at: string | null
          editor_id: string
          editor_payout_cents: number
          hours: number
          id: string
          platform_fee_cents: number
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          total_amount_cents: number
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          editor_id: string
          editor_payout_cents: number
          hours: number
          id?: string
          platform_fee_cents: number
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          total_amount_cents: number
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          editor_id?: string
          editor_payout_cents?: number
          hours?: number
          id?: string
          platform_fee_cents?: number
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          total_amount_cents?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      product_likes: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          attachments: Json | null
          benefits: string[] | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          creator_id: string | null
          currency: string | null
          description: string | null
          download_url: string | null
          duration_label: string | null
          excerpt: string | null
          featured: boolean | null
          id: string
          locked: boolean | null
          name: string
          preview_video_url: string | null
          price_cents: number | null
          pricing_type: string | null
          product_type: string | null
          status: string | null
          subscription_price_cents: number | null
          tags: string[] | null
          updated_at: string | null
          youtube_url: string | null
        }
        Insert: {
          attachments?: Json | null
          benefits?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_id?: string | null
          currency?: string | null
          description?: string | null
          download_url?: string | null
          duration_label?: string | null
          excerpt?: string | null
          featured?: boolean | null
          id?: string
          locked?: boolean | null
          name: string
          preview_video_url?: string | null
          price_cents?: number | null
          pricing_type?: string | null
          product_type?: string | null
          status?: string | null
          subscription_price_cents?: number | null
          tags?: string[] | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          attachments?: Json | null
          benefits?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_id?: string | null
          currency?: string | null
          description?: string | null
          download_url?: string | null
          duration_label?: string | null
          excerpt?: string | null
          featured?: boolean | null
          id?: string
          locked?: boolean | null
          name?: string
          preview_video_url?: string | null
          price_cents?: number | null
          pricing_type?: string | null
          product_type?: string | null
          status?: string | null
          subscription_price_cents?: number | null
          tags?: string[] | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          background_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          editor_about: string | null
          editor_city: string | null
          editor_country: string | null
          editor_hourly_rate_cents: number | null
          editor_languages: string[] | null
          editor_services: string[] | null
          editor_social_links: Json | null
          email: string | null
          full_name: string | null
          id: string
          is_creator: boolean | null
          is_editor: boolean | null
          phone: string | null
          show_recent_uploads: boolean | null
          social_links: Json | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          suspended: boolean | null
          updated_at: string | null
          user_id: string
          username: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          background_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          editor_about?: string | null
          editor_city?: string | null
          editor_country?: string | null
          editor_hourly_rate_cents?: number | null
          editor_languages?: string[] | null
          editor_services?: string[] | null
          editor_social_links?: Json | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_creator?: boolean | null
          is_editor?: boolean | null
          phone?: string | null
          show_recent_uploads?: boolean | null
          social_links?: Json | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          suspended?: boolean | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          background_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          editor_about?: string | null
          editor_city?: string | null
          editor_country?: string | null
          editor_hourly_rate_cents?: number | null
          editor_languages?: string[] | null
          editor_services?: string[] | null
          editor_social_links?: Json | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_creator?: boolean | null
          is_editor?: boolean | null
          phone?: string | null
          show_recent_uploads?: boolean | null
          social_links?: Json | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          suspended?: boolean | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_cents: number
          buyer_id: string
          created_at: string
          creator_payout_cents: number
          id: string
          platform_fee_cents: number
          product_id: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
        }
        Insert: {
          amount_cents: number
          buyer_id: string
          created_at?: string
          creator_payout_cents: number
          id?: string
          platform_fee_cents: number
          product_id: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
        }
        Update: {
          amount_cents?: number
          buyer_id?: string
          created_at?: string
          creator_payout_cents?: number
          id?: string
          platform_fee_cents?: number
          product_id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_products: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          event_type: string
          id: string
          processed_at: string
          stripe_event_id: string
        }
        Insert: {
          event_type: string
          id?: string
          processed_at?: string
          stripe_event_id: string
        }
        Update: {
          event_type?: string
          id?: string
          processed_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          background_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          editor_about: string | null
          editor_city: string | null
          editor_country: string | null
          editor_hourly_rate_cents: number | null
          editor_languages: string[] | null
          editor_services: string[] | null
          editor_social_links: Json | null
          full_name: string | null
          id: string | null
          is_creator: boolean | null
          is_editor: boolean | null
          show_recent_uploads: boolean | null
          social_links: Json | null
          updated_at: string | null
          user_id: string | null
          username: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          background_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          editor_about?: string | null
          editor_city?: string | null
          editor_country?: string | null
          editor_hourly_rate_cents?: number | null
          editor_languages?: string[] | null
          editor_services?: string[] | null
          editor_social_links?: Json | null
          full_name?: string | null
          id?: string | null
          is_creator?: boolean | null
          is_editor?: boolean | null
          show_recent_uploads?: boolean | null
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          background_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          editor_about?: string | null
          editor_city?: string | null
          editor_country?: string | null
          editor_hourly_rate_cents?: number | null
          editor_languages?: string[] | null
          editor_services?: string[] | null
          editor_social_links?: Json | null
          full_name?: string | null
          id?: string | null
          is_creator?: boolean | null
          is_editor?: boolean | null
          show_recent_uploads?: boolean | null
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_username_available: { Args: { p_username: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
