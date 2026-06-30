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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          audience: Database["public"]["Enums"]["announcement_audience"]
          audience_group_id: string | null
          body: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          priority: Database["public"]["Enums"]["announcement_priority"]
          starts_at: string
          title: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["announcement_audience"]
          audience_group_id?: string | null
          body: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["announcement_priority"]
          starts_at?: string
          title: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["announcement_audience"]
          audience_group_id?: string | null
          body?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["announcement_priority"]
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_audience_group_id_fkey"
            columns: ["audience_group_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          action: string
          bucket_start: string
          request_count: number
          user_id: string
        }
        Insert: {
          action: string
          bucket_start: string
          request_count?: number
          user_id: string
        }
        Update: {
          action?: string
          bucket_start?: string
          request_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_follows: {
        Row: {
          business_id: string
          created_at: string
          follower_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          follower_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_follows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_posts: {
        Row: {
          author_id: string
          body: string
          business_id: string
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
        }
        Insert: {
          author_id: string
          body: string
          business_id: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          business_id?: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          banner_url: string | null
          business_name: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_vacation_mode: boolean
          is_verified: boolean
          logo_url: string | null
          seller_level: number
          slug: string
          tagline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          banner_url?: string | null
          business_name: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_vacation_mode?: boolean
          is_verified?: boolean
          logo_url?: string | null
          seller_level?: number
          slug: string
          tagline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          banner_url?: string | null
          business_name?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_vacation_mode?: boolean
          is_verified?: boolean
          logo_url?: string | null
          seller_level?: number
          slug?: string
          tagline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_participants: {
        Row: {
          call_id: string
          joined_at: string | null
          left_at: string | null
          user_id: string
        }
        Insert: {
          call_id: string
          joined_at?: string | null
          left_at?: string | null
          user_id: string
        }
        Update: {
          call_id?: string
          joined_at?: string | null
          left_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_participants_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sessions: {
        Row: {
          call_type: Database["public"]["Enums"]["call_type"]
          conversation_id: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          initiated_by: string
          room_name: string
          started_at: string | null
          status: Database["public"]["Enums"]["call_status"]
        }
        Insert: {
          call_type?: Database["public"]["Enums"]["call_type"]
          conversation_id: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          initiated_by: string
          room_name: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
        }
        Update: {
          call_type?: Database["public"]["Enums"]["call_type"]
          conversation_id?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          initiated_by?: string
          room_name?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
        }
        Relationships: [
          {
            foreignKeyName: "call_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sessions_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_followers: {
        Row: {
          channel_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_followers_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_post_reactions: {
        Row: {
          created_at: string
          emoji: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "channel_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_posts: {
        Row: {
          author_id: string
          body: string
          channel_id: string
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
        }
        Insert: {
          author_id: string
          body: string
          channel_id: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          channel_id?: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          avatar_url: string | null
          business_id: string | null
          community_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          business_id?: string | null
          community_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          business_id?: string | null
          community_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          owner_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          owner_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          joined_at: string
          role: Database["public"]["Enums"]["community_role"]
          user_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string
          role?: Database["public"]["Enums"]["community_role"]
          user_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["community_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          archived: boolean
          conversation_id: string
          created_at: string
          last_read_at: string | null
          muted: boolean
          pinned: boolean
          role: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          conversation_id: string
          created_at?: string
          last_read_at?: string | null
          muted?: boolean
          pinned?: boolean
          role?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          conversation_id?: string
          created_at?: string
          last_read_at?: string | null
          muted?: boolean
          pinned?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          avatar_url: string | null
          community_id: string | null
          created_at: string
          created_by: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          name: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          name?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          community_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          name?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          target_id: string
          target_type: Database["public"]["Enums"]["favorite_target_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          target_id: string
          target_type: Database["public"]["Enums"]["favorite_target_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["favorite_target_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      gig_packages: {
        Row: {
          delivery_days: number
          description: string
          features: string[]
          gig_id: string
          id: string
          price_cents: number
          revisions: number
          tier: Database["public"]["Enums"]["package_tier"]
        }
        Insert: {
          delivery_days: number
          description: string
          features?: string[]
          gig_id: string
          id?: string
          price_cents: number
          revisions?: number
          tier: Database["public"]["Enums"]["package_tier"]
        }
        Update: {
          delivery_days?: number
          description?: string
          features?: string[]
          gig_id?: string
          id?: string
          price_cents?: number
          revisions?: number
          tier?: Database["public"]["Enums"]["package_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "gig_packages_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      gigs: {
        Row: {
          business_id: string
          buyer_requirements: string | null
          category: string
          cover_image_url: string | null
          created_at: string
          currency: string
          description: string | null
          faq: Json
          gallery_urls: string[]
          id: string
          order_count: number
          published_at: string | null
          rating_avg: number
          rating_count: number
          short_description: string | null
          starting_price_cents: number | null
          status: Database["public"]["Enums"]["gig_status"]
          sub_category: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          business_id: string
          buyer_requirements?: string | null
          category: string
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          faq?: Json
          gallery_urls?: string[]
          id?: string
          order_count?: number
          published_at?: string | null
          rating_avg?: number
          rating_count?: number
          short_description?: string | null
          starting_price_cents?: number | null
          status?: Database["public"]["Enums"]["gig_status"]
          sub_category: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          buyer_requirements?: string | null
          category?: string
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          faq?: Json
          gallery_urls?: string[]
          id?: string
          order_count?: number
          published_at?: string | null
          rating_avg?: number
          rating_count?: number
          short_description?: string | null
          starting_price_cents?: number | null
          status?: Database["public"]["Enums"]["gig_status"]
          sub_category?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gigs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          client_id: string | null
          content_type: Database["public"]["Enums"]["message_content_type"]
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          media_metadata: Json | null
          media_url: string | null
          pinned_at: string | null
          reply_to_id: string | null
          sender_id: string
          status: Database["public"]["Enums"]["message_status"]
        }
        Insert: {
          body?: string
          client_id?: string | null
          content_type?: Database["public"]["Enums"]["message_content_type"]
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          media_metadata?: Json | null
          media_url?: string | null
          pinned_at?: string | null
          reply_to_id?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["message_status"]
        }
        Update: {
          body?: string
          client_id?: string | null
          content_type?: Database["public"]["Enums"]["message_content_type"]
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          media_metadata?: Json | null
          media_url?: string | null
          pinned_at?: string | null
          reply_to_id?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["message_status"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action_type"]
          admin_id: string
          created_at: string
          id: string
          note: string | null
          report_id: string | null
          target_id: string | null
          target_type: Database["public"]["Enums"]["report_target_type"] | null
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action_type"]
          admin_id: string
          created_at?: string
          id?: string
          note?: string | null
          report_id?: string | null
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["report_target_type"] | null
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action_type"]
          admin_id?: string
          created_at?: string
          id?: string
          note?: string | null
          report_id?: string | null
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["report_target_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      monetization_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string
          data: Json
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          category: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string
          in_app_enabled: boolean
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: string
          note: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          note?: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          agreement_snapshot: Json
          business_id: string
          buyer_id: string
          completed_at: string | null
          conversation_id: string
          created_at: string
          currency: string
          delivery_days: number
          gig_id: string
          id: string
          package_tier: Database["public"]["Enums"]["package_tier"]
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          platform_fee_cents: number
          price_cents: number
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          terms: string | null
          updated_at: string
        }
        Insert: {
          agreement_snapshot?: Json
          business_id: string
          buyer_id: string
          completed_at?: string | null
          conversation_id: string
          created_at?: string
          currency?: string
          delivery_days: number
          gig_id: string
          id?: string
          package_tier?: Database["public"]["Enums"]["package_tier"]
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          platform_fee_cents?: number
          price_cents: number
          seller_id: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          terms?: string | null
          updated_at?: string
        }
        Update: {
          agreement_snapshot?: Json
          business_id?: string
          buyer_id?: string
          completed_at?: string | null
          conversation_id?: string
          created_at?: string
          currency?: string
          delivery_days?: number
          gig_id?: string
          id?: string
          package_tier?: Database["public"]["Enums"]["package_tier"]
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          platform_fee_cents?: number
          price_cents?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          order_id: string
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          media_type: string
          media_url: string
          sort_order: number
          title: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          media_type: string
          media_url: string
          sort_order?: number
          title: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          media_type?: string
          media_url?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_settings: {
        Row: {
          created_at: string
          phone_discoverable: boolean
          show_last_seen: boolean
          show_online: boolean
          show_read_receipts: boolean
          show_typing: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          phone_discoverable?: boolean
          show_last_seen?: boolean
          show_online?: boolean
          show_read_receipts?: boolean
          show_typing?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          phone_discoverable?: boolean
          show_last_seen?: boolean
          show_online?: boolean
          show_read_receipts?: boolean
          show_typing?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "privacy_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_admin: boolean
          is_business: boolean
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id: string
          is_admin?: boolean
          is_business?: boolean
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_admin?: boolean
          is_business?: boolean
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      read_receipts: {
        Row: {
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target_type"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          communication: number | null
          created_at: string
          delivery: number | null
          direction: Database["public"]["Enums"]["review_direction"]
          id: string
          order_id: string
          overall_rating: number | null
          professionalism: number | null
          quality: number | null
          requirements_quality: number | null
          reviewee_id: string
          reviewer_id: string
          would_recommend: boolean | null
        }
        Insert: {
          comment?: string | null
          communication?: number | null
          created_at?: string
          delivery?: number | null
          direction: Database["public"]["Enums"]["review_direction"]
          id?: string
          order_id: string
          overall_rating?: number | null
          professionalism?: number | null
          quality?: number | null
          requirements_quality?: number | null
          reviewee_id: string
          reviewer_id: string
          would_recommend?: boolean | null
        }
        Update: {
          comment?: string | null
          communication?: number | null
          created_at?: string
          delivery?: number | null
          direction?: Database["public"]["Enums"]["review_direction"]
          id?: string
          order_id?: string
          overall_rating?: number | null
          professionalism?: number | null
          quality?: number | null
          requirements_quality?: number | null
          reviewee_id?: string
          reviewer_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_level_definitions: {
        Row: {
          display_name: string
          level: number
          max_active_gigs: number
          sort_order: number
        }
        Insert: {
          display_name: string
          level: number
          max_active_gigs: number
          sort_order?: number
        }
        Update: {
          display_name?: string
          level?: number
          max_active_gigs?: number
          sort_order?: number
        }
        Relationships: []
      }
      seller_level_requirements: {
        Row: {
          level: number
          min_account_age_days: number
          min_average_rating: number
          min_completed_orders: number
          min_completion_rate: number
        }
        Insert: {
          level: number
          min_account_age_days?: number
          min_average_rating?: number
          min_completed_orders?: number
          min_completion_rate?: number
        }
        Update: {
          level?: number
          min_account_age_days?: number
          min_average_rating?: number
          min_completed_orders?: number
          min_completion_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "seller_level_requirements_level_fkey"
            columns: ["level"]
            isOneToOne: true
            referencedRelation: "seller_level_definitions"
            referencedColumns: ["level"]
          },
        ]
      }
      seller_metrics: {
        Row: {
          accepted_orders: number
          average_rating: number
          business_id: string
          completed_orders: number
          favorites_count: number
          gig_views: number
          profile_views: number
          repeat_buyers: number
          updated_at: string
        }
        Insert: {
          accepted_orders?: number
          average_rating?: number
          business_id: string
          completed_orders?: number
          favorites_count?: number
          gig_views?: number
          profile_views?: number
          repeat_buyers?: number
          updated_at?: string
        }
        Update: {
          accepted_orders?: number
          average_rating?: number
          business_id?: string
          completed_orders?: number
          favorites_count?: number
          gig_views?: number
          profile_views?: number
          repeat_buyers?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_payout_accounts: {
        Row: {
          business_id: string
          created_at: string
          onboarding_completed: boolean
          payouts_enabled: boolean
          stripe_connect_account_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          onboarding_completed?: boolean
          payouts_enabled?: boolean
          stripe_connect_account_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          onboarding_completed?: boolean
          payouts_enabled?: boolean
          stripe_connect_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_payout_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      starred_messages: {
        Row: {
          created_at: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "starred_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "starred_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          background_color: string | null
          created_at: string
          expires_at: string
          id: string
          media_url: string | null
          story_type: Database["public"]["Enums"]["story_type"]
          text_content: string | null
          user_id: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_url?: string | null
          story_type: Database["public"]["Enums"]["story_type"]
          text_content?: string | null
          user_id: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_url?: string | null
          story_type?: Database["public"]["Enums"]["story_type"]
          text_content?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_submissions: {
        Row: {
          admin_note: string | null
          business_id: string
          created_at: string
          document_url: string
          id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          admin_note?: string | null
          business_id: string
          created_at?: string
          document_url: string
          id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          admin_note?: string | null
          business_id?: string
          created_at?: string
          document_url?: string
          id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "verification_submissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _post_order_card_message: {
        Args: { p_body?: string; p_order_id: string }
        Returns: {
          body: string
          client_id: string | null
          content_type: Database["public"]["Enums"]["message_content_type"]
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          media_metadata: Json | null
          media_url: string | null
          pinned_at: string | null
          reply_to_id: string | null
          sender_id: string
          status: Database["public"]["Enums"]["message_status"]
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      _record_order_event: {
        Args: {
          p_actor_id: string
          p_from: Database["public"]["Enums"]["order_status"]
          p_note?: string
          p_order_id: string
          p_to: Database["public"]["Enums"]["order_status"]
        }
        Returns: undefined
      }
      accept_call: { Args: { p_call_id: string }; Returns: undefined }
      accept_order_agreement: {
        Args: { p_order_id: string }
        Returns: {
          agreement_snapshot: Json
          business_id: string
          buyer_id: string
          completed_at: string | null
          conversation_id: string
          created_at: string
          currency: string
          delivery_days: number
          gig_id: string
          id: string
          package_tier: Database["public"]["Enums"]["package_tier"]
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          platform_fee_cents: number
          price_cents: number
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          terms: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      accept_order_delivery: {
        Args: { p_order_id: string }
        Returns: {
          agreement_snapshot: Json
          business_id: string
          buyer_id: string
          completed_at: string | null
          conversation_id: string
          created_at: string
          currency: string
          delivery_days: number
          gig_id: string
          id: string
          package_tier: Database["public"]["Enums"]["package_tier"]
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          platform_fee_cents: number
          price_cents: number
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          terms: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      audit_rls_coverage: {
        Args: never
        Returns: {
          rls_enabled: boolean
          table_name: string
        }[]
      }
      become_business: {
        Args: { p_business_name: string; p_category?: string; p_slug: string }
        Returns: string
      }
      cancel_order: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: {
          agreement_snapshot: Json
          business_id: string
          buyer_id: string
          completed_at: string | null
          conversation_id: string
          created_at: string
          currency: string
          delivery_days: number
          gig_id: string
          id: string
          package_tier: Database["public"]["Enums"]["package_tier"]
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          platform_fee_cents: number
          price_cents: number
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          terms: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_rate_limit: {
        Args: {
          p_action: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      create_channel: {
        Args: {
          p_business_id?: string
          p_community_id?: string
          p_description?: string
          p_name: string
        }
        Returns: string
      }
      create_channel_post: {
        Args: {
          p_body: string
          p_channel_id: string
          p_media_type?: string
          p_media_url?: string
        }
        Returns: string
      }
      create_community: {
        Args: {
          p_description?: string
          p_is_public?: boolean
          p_name: string
          p_slug: string
        }
        Returns: string
      }
      create_group_conversation:
        | { Args: { p_member_ids: string[]; p_name: string }; Returns: string }
        | {
            Args: {
              p_community_id?: string
              p_member_ids: string[]
              p_name: string
            }
            Returns: string
          }
      create_inquiry_order: {
        Args: { p_conversation_id: string; p_gig_id: string }
        Returns: string
      }
      create_order_agreement: {
        Args: {
          p_conversation_id: string
          p_gig_id: string
          p_package_tier: Database["public"]["Enums"]["package_tier"]
          p_terms?: string
        }
        Returns: {
          agreement_snapshot: Json
          business_id: string
          buyer_id: string
          completed_at: string | null
          conversation_id: string
          created_at: string
          currency: string
          delivery_days: number
          gig_id: string
          id: string
          package_tier: Database["public"]["Enums"]["package_tier"]
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          platform_fee_cents: number
          price_cents: number
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          terms: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_story: {
        Args: {
          p_background_color?: string
          p_media_url?: string
          p_story_type: Database["public"]["Enums"]["story_type"]
          p_text_content?: string
        }
        Returns: string
      }
      decline_call: { Args: { p_call_id: string }; Returns: undefined }
      edit_message: {
        Args: { p_body: string; p_message_id: string }
        Returns: {
          body: string
          client_id: string | null
          content_type: Database["public"]["Enums"]["message_content_type"]
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          media_metadata: Json | null
          media_url: string | null
          pinned_at: string | null
          reply_to_id: string | null
          sender_id: string
          status: Database["public"]["Enums"]["message_status"]
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      evaluate_seller_levels: { Args: never; Returns: number }
      expire_stories: { Args: never; Returns: number }
      fetch_active_announcements: {
        Args: { p_user_id?: string }
        Returns: {
          audience: Database["public"]["Enums"]["announcement_audience"]
          audience_group_id: string | null
          body: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          priority: Database["public"]["Enums"]["announcement_priority"]
          starts_at: string
          title: string
        }[]
        SetofOptions: {
          from: "*"
          to: "announcements"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_active_gig_limit: { Args: { p_business_id: string }; Returns: number }
      get_feature_flags: { Args: never; Returns: Json }
      get_or_create_direct_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      get_payment_shell_config: { Args: never; Returns: Json }
      get_seller_analytics: { Args: { p_business_id: string }; Returns: Json }
      get_seller_analytics_series: {
        Args: { p_business_id: string; p_period?: string }
        Returns: Json
      }
      get_unread_notification_count: { Args: never; Returns: number }
      join_community: { Args: { p_community_id: string }; Returns: undefined }
      list_pending_reports: {
        Args: never
        Returns: {
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
        }[]
        SetofOptions: {
          from: "*"
          to: "reports"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_pending_verifications: {
        Args: never
        Returns: {
          admin_note: string | null
          business_id: string
          created_at: string
          document_url: string
          id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["verification_status"]
        }[]
        SetofOptions: {
          from: "*"
          to: "verification_submissions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      mark_conversation_unread: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      mark_order_delivered: {
        Args: { p_note?: string; p_order_id: string }
        Returns: {
          agreement_snapshot: Json
          business_id: string
          buyer_id: string
          completed_at: string | null
          conversation_id: string
          created_at: string
          currency: string
          delivery_days: number
          gig_id: string
          id: string
          package_tier: Database["public"]["Enums"]["package_tier"]
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          platform_fee_cents: number
          price_cents: number
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          terms: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      pin_message: {
        Args: { p_message_id: string }
        Returns: {
          body: string
          client_id: string | null
          content_type: Database["public"]["Enums"]["message_content_type"]
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          media_metadata: Json | null
          media_url: string | null
          pinned_at: string | null
          reply_to_id: string | null
          sender_id: string
          status: Database["public"]["Enums"]["message_status"]
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      process_report: {
        Args: {
          p_action: Database["public"]["Enums"]["moderation_action_type"]
          p_note?: string
          p_report_id: string
        }
        Returns: {
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
        }
        SetofOptions: {
          from: "*"
          to: "reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      process_verification_submission: {
        Args: {
          p_admin_note?: string
          p_approve: boolean
          p_submission_id: string
        }
        Returns: {
          admin_note: string | null
          business_id: string
          created_at: string
          document_url: string
          id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["verification_status"]
        }
        SetofOptions: {
          from: "*"
          to: "verification_submissions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_announcement: {
        Args: {
          p_audience?: Database["public"]["Enums"]["announcement_audience"]
          p_audience_group_id?: string
          p_body: string
          p_expires_at?: string
          p_priority?: Database["public"]["Enums"]["announcement_priority"]
          p_title: string
        }
        Returns: {
          audience: Database["public"]["Enums"]["announcement_audience"]
          audience_group_id: string | null
          body: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          priority: Database["public"]["Enums"]["announcement_priority"]
          starts_at: string
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "announcements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_business_post: {
        Args: {
          p_body: string
          p_business_id: string
          p_media_type?: string
          p_media_url?: string
        }
        Returns: string
      }
      publish_gig: {
        Args: { p_gig_id: string }
        Returns: {
          business_id: string
          buyer_requirements: string | null
          category: string
          cover_image_url: string | null
          created_at: string
          currency: string
          description: string | null
          faq: Json
          gallery_urls: string[]
          id: string
          order_count: number
          published_at: string | null
          rating_avg: number
          rating_count: number
          short_description: string | null
          starting_price_cents: number | null
          status: Database["public"]["Enums"]["gig_status"]
          sub_category: string
          tags: string[]
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "gigs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refresh_seller_metrics: {
        Args: { p_business_id: string }
        Returns: {
          accepted_orders: number
          average_rating: number
          business_id: string
          completed_orders: number
          favorites_count: number
          gig_views: number
          profile_views: number
          repeat_buyers: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "seller_metrics"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_order_revision: {
        Args: { p_note?: string; p_order_id: string }
        Returns: {
          agreement_snapshot: Json
          business_id: string
          buyer_id: string
          completed_at: string | null
          conversation_id: string
          created_at: string
          currency: string
          delivery_days: number
          gig_id: string
          id: string
          package_tier: Database["public"]["Enums"]["package_tier"]
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          platform_fee_cents: number
          price_cents: number
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          terms: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resume_order_work: {
        Args: { p_order_id: string }
        Returns: {
          agreement_snapshot: Json
          business_id: string
          buyer_id: string
          completed_at: string | null
          conversation_id: string
          created_at: string
          currency: string
          delivery_days: number
          gig_id: string
          id: string
          package_tier: Database["public"]["Enums"]["package_tier"]
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          platform_fee_cents: number
          price_cents: number
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          terms: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_order_review: {
        Args: {
          p_comment?: string
          p_communication?: number
          p_delivery?: number
          p_order_id: string
          p_overall?: number
          p_professionalism?: number
          p_quality?: number
          p_requirements_quality?: number
          p_would_recommend?: boolean
        }
        Returns: {
          comment: string | null
          communication: number | null
          created_at: string
          delivery: number | null
          direction: Database["public"]["Enums"]["review_direction"]
          id: string
          order_id: string
          overall_rating: number | null
          professionalism: number | null
          quality: number | null
          requirements_quality: number | null
          reviewee_id: string
          reviewer_id: string
          would_recommend: boolean | null
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_report: {
        Args: {
          p_details?: string
          p_reason: Database["public"]["Enums"]["report_reason"]
          p_target_id: string
          p_target_type: Database["public"]["Enums"]["report_target_type"]
        }
        Returns: string
      }
      submit_verification: { Args: { p_document_url: string }; Returns: string }
      toggle_business_follow: {
        Args: { p_business_id: string }
        Returns: boolean
      }
      toggle_channel_follow: {
        Args: { p_channel_id: string }
        Returns: boolean
      }
      toggle_channel_post_reaction: {
        Args: { p_emoji: string; p_post_id: string }
        Returns: string
      }
      toggle_star_message: { Args: { p_message_id: string }; Returns: boolean }
      toggle_vacation_mode: {
        Args: { p_enabled: boolean }
        Returns: {
          banner_url: string | null
          business_name: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_vacation_mode: boolean
          is_verified: boolean
          logo_url: string | null
          seller_level: number
          slug: string
          tagline: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "business_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      unpin_message: {
        Args: { p_message_id: string }
        Returns: {
          body: string
          client_id: string | null
          content_type: Database["public"]["Enums"]["message_content_type"]
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          media_metadata: Json | null
          media_url: string | null
          pinned_at: string | null
          reply_to_id: string | null
          sender_id: string
          status: Database["public"]["Enums"]["message_status"]
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      view_story: { Args: { p_story_id: string }; Returns: undefined }
    }
    Enums: {
      announcement_audience:
        | "everyone"
        | "businesses"
        | "personal"
        | "specific_group"
      announcement_priority: "normal" | "important"
      call_status: "ringing" | "active" | "ended" | "missed" | "declined"
      call_type: "voice" | "video"
      community_role: "owner" | "admin" | "moderator" | "member"
      conversation_type: "direct" | "group"
      favorite_target_type: "gig" | "business"
      gig_status: "draft" | "published" | "paused" | "archived"
      message_content_type:
        | "text"
        | "image"
        | "video"
        | "voice"
        | "document"
        | "gig_inquiry"
        | "order_card"
        | "gif"
        | "sticker"
        | "location"
        | "contact"
      message_status: "sending" | "sent" | "delivered" | "read" | "failed"
      moderation_action_type:
        | "warn"
        | "suspend"
        | "ban"
        | "remove_content"
        | "dismiss"
      notification_category:
        | "message"
        | "call"
        | "story"
        | "business_update"
        | "marketplace"
        | "order"
        | "review"
        | "verification"
        | "mention"
        | "follower"
        | "community"
        | "system"
      order_status:
        | "inquiry"
        | "waiting"
        | "accepted"
        | "in_progress"
        | "revision_requested"
        | "delivered"
        | "completed"
        | "cancelled"
        | "archived"
      package_tier: "basic" | "standard" | "premium"
      payment_status:
        | "not_required"
        | "pending"
        | "held"
        | "released"
        | "refunded"
        | "failed"
      report_reason:
        | "spam"
        | "scam"
        | "harassment"
        | "copyright"
        | "explicit_content"
        | "other"
      report_status: "pending" | "reviewing" | "resolved" | "dismissed"
      report_target_type:
        | "message"
        | "profile"
        | "business"
        | "gig"
        | "community"
        | "story"
        | "channel_post"
      review_direction: "buyer_to_seller" | "seller_to_buyer"
      story_type: "photo" | "video" | "text"
      verification_status: "pending" | "approved" | "rejected"
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
      announcement_audience: [
        "everyone",
        "businesses",
        "personal",
        "specific_group",
      ],
      announcement_priority: ["normal", "important"],
      call_status: ["ringing", "active", "ended", "missed", "declined"],
      call_type: ["voice", "video"],
      community_role: ["owner", "admin", "moderator", "member"],
      conversation_type: ["direct", "group"],
      favorite_target_type: ["gig", "business"],
      gig_status: ["draft", "published", "paused", "archived"],
      message_content_type: [
        "text",
        "image",
        "video",
        "voice",
        "document",
        "gig_inquiry",
        "order_card",
        "gif",
        "sticker",
        "location",
        "contact",
      ],
      message_status: ["sending", "sent", "delivered", "read", "failed"],
      moderation_action_type: [
        "warn",
        "suspend",
        "ban",
        "remove_content",
        "dismiss",
      ],
      notification_category: [
        "message",
        "call",
        "story",
        "business_update",
        "marketplace",
        "order",
        "review",
        "verification",
        "mention",
        "follower",
        "community",
        "system",
      ],
      order_status: [
        "inquiry",
        "waiting",
        "accepted",
        "in_progress",
        "revision_requested",
        "delivered",
        "completed",
        "cancelled",
        "archived",
      ],
      package_tier: ["basic", "standard", "premium"],
      payment_status: [
        "not_required",
        "pending",
        "held",
        "released",
        "refunded",
        "failed",
      ],
      report_reason: [
        "spam",
        "scam",
        "harassment",
        "copyright",
        "explicit_content",
        "other",
      ],
      report_status: ["pending", "reviewing", "resolved", "dismissed"],
      report_target_type: [
        "message",
        "profile",
        "business",
        "gig",
        "community",
        "story",
        "channel_post",
      ],
      review_direction: ["buyer_to_seller", "seller_to_buyer"],
      story_type: ["photo", "video", "text"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
