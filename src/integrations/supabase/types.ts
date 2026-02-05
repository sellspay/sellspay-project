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
      admin_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_value: Json | null
          notes: string | null
          old_value: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          notes?: string | null
          old_value?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          notes?: string | null
          old_value?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          applicant_id: string | null
          application_type: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          redirect_url: string | null
          type: string
        }
        Insert: {
          applicant_id?: string | null
          application_type?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          redirect_url?: string | null
          type: string
        }
        Update: {
          applicant_id?: string | null
          application_type?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          redirect_url?: string | null
          type?: string
        }
        Relationships: []
      }
      ai_runs: {
        Row: {
          applied: boolean | null
          cost_estimate: number | null
          created_at: string
          diff_summary: Json | null
          failure_tags: string[] | null
          id: string
          intent_json: Json | null
          latency_ms: number | null
          ops_json: Json | null
          plan_json: Json | null
          prompt_raw: string
          repair_attempts: number | null
          storefront_id: string
          updated_at: string
          user_action: Database["public"]["Enums"]["ai_user_action"] | null
          user_id: string
          validation_errors: Json | null
        }
        Insert: {
          applied?: boolean | null
          cost_estimate?: number | null
          created_at?: string
          diff_summary?: Json | null
          failure_tags?: string[] | null
          id?: string
          intent_json?: Json | null
          latency_ms?: number | null
          ops_json?: Json | null
          plan_json?: Json | null
          prompt_raw: string
          repair_attempts?: number | null
          storefront_id: string
          updated_at?: string
          user_action?: Database["public"]["Enums"]["ai_user_action"] | null
          user_id: string
          validation_errors?: Json | null
        }
        Update: {
          applied?: boolean | null
          cost_estimate?: number | null
          created_at?: string
          diff_summary?: Json | null
          failure_tags?: string[] | null
          id?: string
          intent_json?: Json | null
          latency_ms?: number | null
          ops_json?: Json | null
          plan_json?: Json | null
          prompt_raw?: string
          repair_attempts?: number | null
          storefront_id?: string
          updated_at?: string
          user_action?: Database["public"]["Enums"]["ai_user_action"] | null
          user_id?: string
          validation_errors?: Json | null
        }
        Relationships: []
      }
      ai_storefront_layouts: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          layout_json: Json
          profile_id: string
          updated_at: string
          version: number
          vibecoder_mode: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          layout_json?: Json
          profile_id: string
          updated_at?: string
          version?: number
          vibecoder_mode?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          layout_json?: Json
          profile_id?: string
          updated_at?: string
          version?: number
          vibecoder_mode?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_storefront_layouts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_storefront_layouts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_storefront_layouts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "safe_public_identities"
            referencedColumns: ["id"]
          },
        ]
      }
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
          style_options: Json | null
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
          style_options?: Json | null
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
          style_options?: Json | null
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
          is_pinned: boolean | null
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
          is_pinned?: boolean | null
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
          is_pinned?: boolean | null
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
      country_eligibility: {
        Row: {
          connect_eligible: boolean | null
          country_code: string
          country_name: string
          notes: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          connect_eligible?: boolean | null
          country_code: string
          country_name: string
          notes?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          connect_eligible?: boolean | null
          country_code?: string
          country_name?: string
          notes?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      creator_applications: {
        Row: {
          country: string
          created_at: string
          full_name: string
          id: string
          languages: string[]
          product_types: string[]
          reviewed_at: string | null
          reviewed_by: string | null
          social_links: Json
          state: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          country: string
          created_at?: string
          full_name: string
          id?: string
          languages: string[]
          product_types: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_links?: Json
          state: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          languages?: string[]
          product_types?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_links?: Json
          state?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_nominations: {
        Row: {
          created_at: string | null
          creator_id: string
          id: string
          nominator_id: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          id?: string
          nominator_id: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          id?: string
          nominator_id?: string
        }
        Relationships: []
      }
      creator_spotlights: {
        Row: {
          achievement: string | null
          created_at: string
          display_order: number | null
          featured_at: string
          headline: string
          id: string
          is_active: boolean | null
          profile_id: string
          quote: string | null
          story: string
          updated_at: string
        }
        Insert: {
          achievement?: string | null
          created_at?: string
          display_order?: number | null
          featured_at?: string
          headline: string
          id?: string
          is_active?: boolean | null
          profile_id: string
          quote?: string | null
          story: string
          updated_at?: string
        }
        Update: {
          achievement?: string | null
          created_at?: string
          display_order?: number | null
          featured_at?: string
          headline?: string
          id?: string
          is_active?: boolean | null
          profile_id?: string
          quote?: string | null
          story?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_subscription_plans: {
        Row: {
          created_at: string
          creator_id: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_cents: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_cents: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_subscription_plans_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_subscription_plans_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_subscription_plans_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "safe_public_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packages: {
        Row: {
          created_at: string | null
          credits: number
          display_order: number | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          name: string
          price_cents: number
          stripe_price_id: string | null
          stripe_product_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name: string
          price_cents: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name?: string
          price_cents?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Relationships: []
      }
      credit_topups: {
        Row: {
          created_at: string | null
          credits: number
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          price_cents: number
          stripe_price_id: string | null
          stripe_product_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price_cents: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_cents?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          package_id: string | null
          stripe_session_id: string | null
          tool_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          package_id?: string | null
          stripe_session_id?: string | null
          tool_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          package_id?: string | null
          stripe_session_id?: string | null
          tool_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
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
          chat_expires_at: string | null
          completed_at: string | null
          created_at: string | null
          editor_id: string
          editor_payout_cents: number
          hours: number
          id: string
          platform_fee_cents: number
          queue_position: number | null
          started_at: string | null
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          total_amount_cents: number
          transferred: boolean | null
          transferred_at: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          chat_expires_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          editor_id: string
          editor_payout_cents: number
          hours: number
          id?: string
          platform_fee_cents: number
          queue_position?: number | null
          started_at?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          total_amount_cents: number
          transferred?: boolean | null
          transferred_at?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          chat_expires_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          editor_id?: string
          editor_payout_cents?: number
          hours?: number
          id?: string
          platform_fee_cents?: number
          queue_position?: number | null
          started_at?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          total_amount_cents?: number
          transferred?: boolean | null
          transferred_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      editor_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          room_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editor_chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "editor_chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      editor_chat_rooms: {
        Row: {
          booking_id: string
          buyer_id: string
          created_at: string
          editor_id: string
          expires_at: string
          id: string
          is_active: boolean
        }
        Insert: {
          booking_id: string
          buyer_id: string
          created_at?: string
          editor_id: string
          expires_at: string
          id?: string
          is_active?: boolean
        }
        Update: {
          booking_id?: string
          buyer_id?: string
          created_at?: string
          editor_id?: string
          expires_at?: string
          id?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "editor_chat_rooms_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "editor_bookings"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          actor_id: string | null
          comment_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          product_id: string | null
          redirect_url: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          product_id?: string | null
          redirect_url?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          product_id?: string | null
          redirect_url?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          admin_notes: string | null
          amount_cents: number
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          currency: string | null
          external_reference: string | null
          failure_reason: string | null
          id: string
          provider_type: string
          requested_at: string | null
          seller_id: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount_cents: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          currency?: string | null
          external_reference?: string | null
          failure_reason?: string | null
          id?: string
          provider_type: string
          requested_at?: string | null
          seller_id: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount_cents?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          currency?: string | null
          external_reference?: string | null
          failure_reason?: string | null
          id?: string
          provider_type?: string
          requested_at?: string | null
          seller_id?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "safe_public_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      paypal_oauth_states: {
        Row: {
          created_at: string
          expires_at: string
          state_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          state_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          state_token?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_updates: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          category?: string
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "safe_public_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_tool_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_downloads: {
        Row: {
          created_at: string
          downloaded_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          downloaded_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          downloaded_at?: string
          id?: string
          product_id?: string
          user_id?: string
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
      product_views: {
        Row: {
          city: string | null
          country_code: string | null
          created_at: string
          id: string
          product_id: string
          referrer: string | null
          referrer_domain: string | null
          viewer_id: string | null
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          product_id: string
          referrer?: string | null
          referrer_domain?: string | null
          viewer_id?: string | null
        }
        Update: {
          city?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          product_id?: string
          referrer?: string | null
          referrer_domain?: string | null
          viewer_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          attachments: Json | null
          benefits: string[] | null
          cover_image_url: string | null
          created_at: string | null
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
          original_filename: string | null
          preview_video_url: string | null
          price_cents: number | null
          pricing_type: string | null
          product_type: string | null
          slug: string | null
          status: string | null
          subscription_access: string | null
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
          original_filename?: string | null
          preview_video_url?: string | null
          price_cents?: number | null
          pricing_type?: string | null
          product_type?: string | null
          slug?: string | null
          status?: string | null
          subscription_access?: string | null
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
          original_filename?: string | null
          preview_video_url?: string | null
          price_cents?: number | null
          pricing_type?: string | null
          product_type?: string | null
          slug?: string | null
          status?: string | null
          subscription_access?: string | null
          subscription_price_cents?: number | null
          tags?: string[] | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      profile_sections: {
        Row: {
          content: Json
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          profile_id: string
          section_type: string
          style_options: Json
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          profile_id: string
          section_type: string
          style_options?: Json
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          profile_id?: string
          section_type?: string
          style_options?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_sections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_sections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_sections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "safe_public_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          city: string | null
          country_code: string | null
          created_at: string
          id: string
          profile_id: string
          referrer: string | null
          referrer_domain: string | null
          viewer_id: string | null
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          profile_id: string
          referrer?: string | null
          referrer_domain?: string | null
          viewer_id?: string | null
        }
        Update: {
          city?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          referrer?: string | null
          referrer_domain?: string | null
          viewer_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_project_id: string | null
          active_storefront_mode: string
          avatar_url: string | null
          background_url: string | null
          banner_position_y: number | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          credit_balance: number | null
          editor_about: string | null
          editor_city: string | null
          editor_country: string | null
          editor_hourly_rate_cents: number | null
          editor_languages: string[] | null
          editor_services: string[] | null
          editor_social_links: Json | null
          email_notifications_enabled: boolean | null
          full_name: string | null
          global_custom_font: Json | null
          global_font: string | null
          id: string
          is_creator: boolean | null
          is_editor: boolean | null
          is_seller: boolean | null
          last_username_changed_at: string | null
          mfa_enabled: boolean | null
          previous_username: string | null
          previous_username_available_at: string | null
          seller_country_code: string | null
          seller_kyc_status: string | null
          seller_mode: string | null
          seller_status: string | null
          show_recent_uploads: boolean | null
          social_links: Json | null
          subscription_tier: string | null
          suspended: boolean | null
          updated_at: string | null
          user_id: string
          username: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          active_project_id?: string | null
          active_storefront_mode?: string
          avatar_url?: string | null
          background_url?: string | null
          banner_position_y?: number | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          credit_balance?: number | null
          editor_about?: string | null
          editor_city?: string | null
          editor_country?: string | null
          editor_hourly_rate_cents?: number | null
          editor_languages?: string[] | null
          editor_services?: string[] | null
          editor_social_links?: Json | null
          email_notifications_enabled?: boolean | null
          full_name?: string | null
          global_custom_font?: Json | null
          global_font?: string | null
          id?: string
          is_creator?: boolean | null
          is_editor?: boolean | null
          is_seller?: boolean | null
          last_username_changed_at?: string | null
          mfa_enabled?: boolean | null
          previous_username?: string | null
          previous_username_available_at?: string | null
          seller_country_code?: string | null
          seller_kyc_status?: string | null
          seller_mode?: string | null
          seller_status?: string | null
          show_recent_uploads?: boolean | null
          social_links?: Json | null
          subscription_tier?: string | null
          suspended?: boolean | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          active_project_id?: string | null
          active_storefront_mode?: string
          avatar_url?: string | null
          background_url?: string | null
          banner_position_y?: number | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          credit_balance?: number | null
          editor_about?: string | null
          editor_city?: string | null
          editor_country?: string | null
          editor_hourly_rate_cents?: number | null
          editor_languages?: string[] | null
          editor_services?: string[] | null
          editor_social_links?: Json | null
          email_notifications_enabled?: boolean | null
          full_name?: string | null
          global_custom_font?: Json | null
          global_font?: string | null
          id?: string
          is_creator?: boolean | null
          is_editor?: boolean | null
          is_seller?: boolean | null
          last_username_changed_at?: string | null
          mfa_enabled?: boolean | null
          previous_username?: string | null
          previous_username_available_at?: string | null
          seller_country_code?: string | null
          seller_kyc_status?: string | null
          seller_mode?: string | null
          seller_status?: string | null
          show_recent_uploads?: boolean | null
          social_links?: Json | null
          subscription_tier?: string | null
          suspended?: boolean | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_project_id_fkey"
            columns: ["active_project_id"]
            isOneToOne: false
            referencedRelation: "vibecoder_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          content: string
          created_at: string
          file_path: string
          id: string
          profile_id: string
          updated_at: string
          version: number
        }
        Insert: {
          content?: string
          created_at?: string
          file_path: string
          id?: string
          profile_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          file_path?: string
          id?: string
          profile_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_files_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "safe_public_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      public_identities_cache: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          is_creator: boolean | null
          is_editor: boolean | null
          is_owner: boolean | null
          updated_at: string
          user_id: string
          username: string | null
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          is_creator?: boolean | null
          is_editor?: boolean | null
          is_owner?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          is_creator?: boolean | null
          is_editor?: boolean | null
          is_owner?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_cents: number
          available_on: string | null
          buyer_id: string
          created_at: string
          creator_payout_cents: number
          dispute_status: string | null
          funds_flow_mode: string | null
          id: string
          platform_fee_cents: number
          product_id: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          transferred: boolean | null
          transferred_at: string | null
        }
        Insert: {
          amount_cents: number
          available_on?: string | null
          buyer_id: string
          created_at?: string
          creator_payout_cents: number
          dispute_status?: string | null
          funds_flow_mode?: string | null
          id?: string
          platform_fee_cents: number
          product_id: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          transferred?: boolean | null
          transferred_at?: string | null
        }
        Update: {
          amount_cents?: number
          available_on?: string | null
          buyer_id?: string
          created_at?: string
          creator_payout_cents?: number
          dispute_status?: string | null
          funds_flow_mode?: string | null
          id?: string
          platform_fee_cents?: number
          product_id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          transferred?: boolean | null
          transferred_at?: string | null
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
            foreignKeyName: "purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "safe_public_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
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
      site_content: {
        Row: {
          created_at: string | null
          hero_headline: string | null
          hero_image_url: string | null
          hero_media_type: string | null
          hero_rotating_words: string[] | null
          hero_stats: Json | null
          hero_subheadline: string | null
          hero_subtitle: string | null
          hero_video_url: string | null
          id: string
          manga_thumbnails: Json | null
          reveal_panel_1_media_type: string | null
          reveal_panel_1_media_url: string | null
          reveal_panel_2_media_type: string | null
          reveal_panel_2_media_url: string | null
          reveal_panel_3_media_type: string | null
          reveal_panel_3_media_url: string | null
          reveal_panel_4_media_type: string | null
          reveal_panel_4_media_url: string | null
          reveal_panel_5_media_type: string | null
          reveal_panel_5_media_url: string | null
          reveal_panel_6_media_type: string | null
          reveal_panel_6_media_url: string | null
          sfx_thumbnails: Json | null
          tool_audio_converter_banner_url: string | null
          tool_audio_cutter_banner_url: string | null
          tool_audio_joiner_banner_url: string | null
          tool_audio_recorder_banner_url: string | null
          tool_manga_banner_url: string | null
          tool_music_splitter_banner_url: string | null
          tool_sfx_banner_url: string | null
          tool_sfx_isolator_banner_url: string | null
          tool_video_banner_url: string | null
          tool_video_to_audio_banner_url: string | null
          tool_vocal_banner_url: string | null
          tool_waveform_banner_url: string | null
          tools_subtitle: string | null
          tools_title: string | null
          updated_at: string | null
          video_thumbnails: Json | null
          vocal_thumbnails: Json | null
        }
        Insert: {
          created_at?: string | null
          hero_headline?: string | null
          hero_image_url?: string | null
          hero_media_type?: string | null
          hero_rotating_words?: string[] | null
          hero_stats?: Json | null
          hero_subheadline?: string | null
          hero_subtitle?: string | null
          hero_video_url?: string | null
          id?: string
          manga_thumbnails?: Json | null
          reveal_panel_1_media_type?: string | null
          reveal_panel_1_media_url?: string | null
          reveal_panel_2_media_type?: string | null
          reveal_panel_2_media_url?: string | null
          reveal_panel_3_media_type?: string | null
          reveal_panel_3_media_url?: string | null
          reveal_panel_4_media_type?: string | null
          reveal_panel_4_media_url?: string | null
          reveal_panel_5_media_type?: string | null
          reveal_panel_5_media_url?: string | null
          reveal_panel_6_media_type?: string | null
          reveal_panel_6_media_url?: string | null
          sfx_thumbnails?: Json | null
          tool_audio_converter_banner_url?: string | null
          tool_audio_cutter_banner_url?: string | null
          tool_audio_joiner_banner_url?: string | null
          tool_audio_recorder_banner_url?: string | null
          tool_manga_banner_url?: string | null
          tool_music_splitter_banner_url?: string | null
          tool_sfx_banner_url?: string | null
          tool_sfx_isolator_banner_url?: string | null
          tool_video_banner_url?: string | null
          tool_video_to_audio_banner_url?: string | null
          tool_vocal_banner_url?: string | null
          tool_waveform_banner_url?: string | null
          tools_subtitle?: string | null
          tools_title?: string | null
          updated_at?: string | null
          video_thumbnails?: Json | null
          vocal_thumbnails?: Json | null
        }
        Update: {
          created_at?: string | null
          hero_headline?: string | null
          hero_image_url?: string | null
          hero_media_type?: string | null
          hero_rotating_words?: string[] | null
          hero_stats?: Json | null
          hero_subheadline?: string | null
          hero_subtitle?: string | null
          hero_video_url?: string | null
          id?: string
          manga_thumbnails?: Json | null
          reveal_panel_1_media_type?: string | null
          reveal_panel_1_media_url?: string | null
          reveal_panel_2_media_type?: string | null
          reveal_panel_2_media_url?: string | null
          reveal_panel_3_media_type?: string | null
          reveal_panel_3_media_url?: string | null
          reveal_panel_4_media_type?: string | null
          reveal_panel_4_media_url?: string | null
          reveal_panel_5_media_type?: string | null
          reveal_panel_5_media_url?: string | null
          reveal_panel_6_media_type?: string | null
          reveal_panel_6_media_url?: string | null
          sfx_thumbnails?: Json | null
          tool_audio_converter_banner_url?: string | null
          tool_audio_cutter_banner_url?: string | null
          tool_audio_joiner_banner_url?: string | null
          tool_audio_recorder_banner_url?: string | null
          tool_manga_banner_url?: string | null
          tool_music_splitter_banner_url?: string | null
          tool_sfx_banner_url?: string | null
          tool_sfx_isolator_banner_url?: string | null
          tool_video_banner_url?: string | null
          tool_video_to_audio_banner_url?: string | null
          tool_vocal_banner_url?: string | null
          tool_waveform_banner_url?: string | null
          tools_subtitle?: string | null
          tools_title?: string | null
          updated_at?: string | null
          video_thumbnails?: Json | null
          vocal_thumbnails?: Json | null
        }
        Relationships: []
      }
      storefront_ai_conversations: {
        Row: {
          asset_requests: Json | null
          content: string
          created_at: string
          id: string
          operations: Json | null
          profile_id: string
          role: string
        }
        Insert: {
          asset_requests?: Json | null
          content: string
          created_at?: string
          id?: string
          operations?: Json | null
          profile_id: string
          role: string
        }
        Update: {
          asset_requests?: Json | null
          content?: string
          created_at?: string
          id?: string
          operations?: Json | null
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_ai_conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storefront_ai_conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storefront_ai_conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "safe_public_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_ai_usage: {
        Row: {
          action_type: string
          created_at: string
          credits_used: number
          id: string
          profile_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          credits_used?: number
          id?: string
          profile_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          credits_used?: number
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_ai_usage_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storefront_ai_usage_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storefront_ai_usage_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "safe_public_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_brand_profiles: {
        Row: {
          color_palette: Json | null
          created_at: string
          font_preference: string | null
          id: string
          profile_id: string
          reference_images: Json | null
          updated_at: string
          vibe_tags: string[] | null
        }
        Insert: {
          color_palette?: Json | null
          created_at?: string
          font_preference?: string | null
          id?: string
          profile_id: string
          reference_images?: Json | null
          updated_at?: string
          vibe_tags?: string[] | null
        }
        Update: {
          color_palette?: Json | null
          created_at?: string
          font_preference?: string | null
          id?: string
          profile_id?: string
          reference_images?: Json | null
          updated_at?: string
          vibe_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "storefront_brand_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storefront_brand_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storefront_brand_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "safe_public_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_generated_assets: {
        Row: {
          asset_type: string
          asset_url: string
          created_at: string
          id: string
          profile_id: string
          prompt: string | null
          spec: Json | null
          status: string
        }
        Insert: {
          asset_type: string
          asset_url: string
          created_at?: string
          id?: string
          profile_id: string
          prompt?: string | null
          spec?: Json | null
          status?: string
        }
        Update: {
          asset_type?: string
          asset_url?: string
          created_at?: string
          id?: string
          profile_id?: string
          prompt?: string | null
          spec?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_generated_assets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storefront_generated_assets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storefront_generated_assets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "safe_public_identities"
            referencedColumns: ["id"]
          },
        ]
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
      subscription_plan_products: {
        Row: {
          created_at: string
          discount_percent: number | null
          discount_type: string | null
          id: string
          is_free: boolean | null
          plan_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          discount_type?: string | null
          id?: string
          is_free?: boolean | null
          plan_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          discount_type?: string | null
          id?: string
          is_free?: boolean | null
          plan_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plan_products_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "creator_subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_plan_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_plan_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string
          customer_profile_id: string
          direction: string
          id: string
          message: string
          product_id: string | null
          seller_profile_id: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          customer_profile_id: string
          direction: string
          id?: string
          message: string
          product_id?: string | null
          seller_profile_id: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          customer_profile_id?: string
          direction?: string
          id?: string
          message?: string
          product_id?: string | null
          seller_profile_id?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "safe_public_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "safe_public_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_likes: {
        Row: {
          created_at: string
          id: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_likes_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          gif_url: string | null
          id: string
          parent_reply_id: string | null
          thread_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          gif_url?: string | null
          id?: string
          parent_reply_id?: string | null
          thread_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          gif_url?: string | null
          id?: string
          parent_reply_id?: string | null
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "thread_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_reply_likes: {
        Row: {
          created_at: string
          id: string
          reply_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reply_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reply_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_reply_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "thread_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          gif_url: string | null
          id: string
          image_url: string | null
          is_pinned: boolean | null
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string
          content: string
          created_at?: string
          gif_url?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          gif_url?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      tool_usage: {
        Row: {
          id: string
          tool_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          id?: string
          tool_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          id?: string
          tool_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unfollow_history: {
        Row: {
          can_refollow_at: string
          created_at: string
          id: string
          unfollowed_at: string
          unfollowed_id: string
          unfollower_id: string
        }
        Insert: {
          can_refollow_at?: string
          created_at?: string
          id?: string
          unfollowed_at?: string
          unfollowed_id: string
          unfollower_id: string
        }
        Update: {
          can_refollow_at?: string
          created_at?: string
          id?: string
          unfollowed_at?: string
          unfollowed_id?: string
          unfollower_id?: string
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
      user_subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "creator_subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      vibecoder_messages: {
        Row: {
          code_snapshot: string | null
          content: string | null
          created_at: string
          id: string
          project_id: string
          rating: number | null
          role: string
        }
        Insert: {
          code_snapshot?: string | null
          content?: string | null
          created_at?: string
          id?: string
          project_id: string
          rating?: number | null
          role: string
        }
        Update: {
          code_snapshot?: string | null
          content?: string | null
          created_at?: string
          id?: string
          project_id?: string
          rating?: number | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibecoder_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vibecoder_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vibecoder_projects: {
        Row: {
          created_at: string
          id: string
          last_edited_at: string
          name: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_edited_at?: string
          name?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_edited_at?: string
          name?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_ledger_entries: {
        Row: {
          amount_cents: number
          available_on: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          entry_type: string
          id: string
          order_id: string | null
          order_type: string | null
          seller_id: string
          status: string | null
        }
        Insert: {
          amount_cents: number
          available_on?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          entry_type: string
          id?: string
          order_id?: string | null
          order_type?: string | null
          seller_id: string
          status?: string | null
        }
        Update: {
          amount_cents?: number
          available_on?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          entry_type?: string
          id?: string
          order_id?: string | null
          order_type?: string | null
          seller_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_entries_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_ledger_entries_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_ledger_entries_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "safe_public_identities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_identities: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          is_creator: boolean | null
          is_editor: boolean | null
          is_owner: boolean | null
          user_id: string | null
          username: string | null
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          is_creator?: boolean | null
          is_editor?: boolean | null
          is_owner?: boolean | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          is_creator?: boolean | null
          is_editor?: boolean | null
          is_owner?: boolean | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      public_products: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          creator_id: string | null
          currency: string | null
          description: string | null
          duration_label: string | null
          excerpt: string | null
          featured: boolean | null
          id: string | null
          name: string | null
          preview_video_url: string | null
          price_cents: number | null
          pricing_type: string | null
          product_type: string | null
          slug: string | null
          status: string | null
          subscription_access: string | null
          tags: string[] | null
          updated_at: string | null
          youtube_url: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          description?: string | null
          duration_label?: string | null
          excerpt?: string | null
          featured?: boolean | null
          id?: string | null
          name?: string | null
          preview_video_url?: string | null
          price_cents?: number | null
          pricing_type?: string | null
          product_type?: string | null
          slug?: string | null
          status?: string | null
          subscription_access?: string | null
          tags?: string[] | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          description?: string | null
          duration_label?: string | null
          excerpt?: string | null
          featured?: boolean | null
          id?: string | null
          name?: string | null
          preview_video_url?: string | null
          price_cents?: number | null
          pricing_type?: string | null
          product_type?: string | null
          slug?: string | null
          status?: string | null
          subscription_access?: string | null
          tags?: string[] | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          background_url: string | null
          banner_position_y: number | null
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
          global_custom_font: Json | null
          global_font: string | null
          id: string | null
          is_creator: boolean | null
          is_editor: boolean | null
          is_owner: boolean | null
          is_seller: boolean | null
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
          banner_position_y?: number | null
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
          global_custom_font?: Json | null
          global_font?: string | null
          id?: string | null
          is_creator?: boolean | null
          is_editor?: boolean | null
          is_owner?: never
          is_seller?: boolean | null
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
          banner_position_y?: number | null
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
          global_custom_font?: Json | null
          global_font?: string | null
          id?: string | null
          is_creator?: boolean | null
          is_editor?: boolean | null
          is_owner?: never
          is_seller?: boolean | null
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
      safe_public_identities: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          is_creator: boolean | null
          is_editor: boolean | null
          is_owner: boolean | null
          user_id: string | null
          username: string | null
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          is_creator?: boolean | null
          is_editor?: boolean | null
          is_owner?: never
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          is_creator?: boolean | null
          is_editor?: boolean | null
          is_owner?: never
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_project_fully: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      disconnect_seller_paypal: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      generate_username_from_email: {
        Args: { p_email: string }
        Returns: string
      }
      get_active_spotlights: {
        Args: never
        Returns: {
          achievement: string
          featured_at: string
          headline: string
          id: string
          profile_avatar_url: string
          profile_bio: string
          profile_full_name: string
          profile_id: string
          profile_user_id: string
          profile_username: string
          profile_verified: boolean
          quote: string
          story: string
        }[]
      }
      get_email_by_username: { Args: { p_username: string }; Returns: string }
      get_home_stats: {
        Args: never
        Returns: {
          community_members: number
          premium_products: number
          total_downloads: number
          verified_creators: number
          verified_sellers: number
        }[]
      }
      get_monthly_tool_usage: { Args: { p_user_id: string }; Returns: number }
      get_seller_config: {
        Args: { p_user_id: string }
        Returns: {
          payoneer_payee_id: string
          payoneer_status: string
          paypal_email: string
          paypal_payout_enabled: boolean
          stripe_account_id: string
          stripe_onboarding_complete: boolean
        }[]
      }
      get_seller_email_config: {
        Args: { p_seller_user_id: string }
        Returns: Json
      }
      get_seller_resend_key: {
        Args: { p_seller_user_id: string }
        Returns: string
      }
      get_seller_wallet_balance: {
        Args: { p_seller_id: string }
        Returns: {
          available_cents: number
          locked_cents: number
          pending_cents: number
          total_earned_cents: number
          total_withdrawn_cents: number
        }[]
      }
      has_pro_subscription: { Args: { p_user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_email_available: { Args: { p_email: string }; Returns: boolean }
      is_owner: { Args: { p_user_id: string }; Returns: boolean }
      is_username_available: { Args: { p_username: string }; Returns: boolean }
      is_username_available_v2: {
        Args: { p_username: string }
        Returns: boolean
      }
      mark_seller_email_verified: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      release_held_funds: { Args: never; Returns: number }
      store_seller_resend_key: {
        Args: { p_api_key: string; p_support_email: string }
        Returns: Json
      }
      update_seller_paypal_config: {
        Args: { p_paypal_email: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      ai_user_action:
        | "applied"
        | "edited"
        | "rejected"
        | "regenerated"
        | "undone"
      app_role: "admin" | "moderator" | "user" | "owner"
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
      ai_user_action: [
        "applied",
        "edited",
        "rejected",
        "regenerated",
        "undone",
      ],
      app_role: ["admin", "moderator", "user", "owner"],
    },
  },
} as const
