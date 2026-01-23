export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          phone: string | null
          address: string | null
          role: 'admin' | 'user'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          address?: string | null
          role?: 'admin' | 'user'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          address?: string | null
          role?: 'admin' | 'user'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          address: string
          city: string
          province: string
          postal_code: string | null
          latitude: number | null
          longitude: number | null
          google_rating: number | null
          google_reviews_count: number | null
          booking_rating: number | null
          booking_reviews_count: number | null
          airbnb_rating: number | null
          airbnb_reviews_count: number | null
          overall_score: number | null
          ranking_position: number | null
          property_type: string
          amenities: string[] | null
          cover_image: string | null
          is_featured: boolean
          is_active: boolean
          owner_id: string | null
          google_place_id: string | null
          google_maps_url: string | null
          booking_url: string | null
          airbnb_url: string | null
          ratings_updated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          address: string
          city: string
          province: string
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          google_rating?: number | null
          google_reviews_count?: number | null
          booking_rating?: number | null
          booking_reviews_count?: number | null
          airbnb_rating?: number | null
          airbnb_reviews_count?: number | null
          overall_score?: number | null
          ranking_position?: number | null
          property_type: string
          amenities?: string[] | null
          cover_image?: string | null
          is_featured?: boolean
          is_active?: boolean
          owner_id?: string | null
          google_place_id?: string | null
          google_maps_url?: string | null
          booking_url?: string | null
          airbnb_url?: string | null
          ratings_updated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          address?: string
          city?: string
          province?: string
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          google_rating?: number | null
          google_reviews_count?: number | null
          booking_rating?: number | null
          booking_reviews_count?: number | null
          airbnb_rating?: number | null
          airbnb_reviews_count?: number | null
          overall_score?: number | null
          ranking_position?: number | null
          property_type?: string
          amenities?: string[] | null
          cover_image?: string | null
          is_featured?: boolean
          is_active?: boolean
          owner_id?: string | null
          google_place_id?: string | null
          google_maps_url?: string | null
          booking_url?: string | null
          airbnb_url?: string | null
          ratings_updated_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      media: {
        Row: {
          id: string
          property_id: string
          file_name: string
          file_url: string
          file_type: 'image' | 'video'
          file_size: number | null
          mime_type: string | null
          width: number | null
          height: number | null
          duration: number | null
          thumbnail_url: string | null
          is_cover: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          file_name: string
          file_url: string
          file_type: 'image' | 'video'
          file_size?: number | null
          mime_type?: string | null
          width?: number | null
          height?: number | null
          duration?: number | null
          thumbnail_url?: string | null
          is_cover?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          file_name?: string
          file_url?: string
          file_type?: 'image' | 'video'
          file_size?: number | null
          mime_type?: string | null
          width?: number | null
          height?: number | null
          duration?: number | null
          thumbnail_url?: string | null
          is_cover?: boolean
          order_index?: number
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          property_id: string | null
          budget_number: string
          title: string
          description: string | null
          items: Json
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          valid_until: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id?: string | null
          budget_number: string
          title: string
          description?: string | null
          items: Json
          subtotal: number
          tax_rate?: number
          tax_amount: number
          total: number
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          valid_until?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string | null
          budget_number?: string
          title?: string
          description?: string | null
          items?: Json
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          valid_until?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          budget_id: string | null
          invoice_number: string
          title: string
          description: string | null
          items: Json
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date: string | null
          paid_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          budget_id?: string | null
          invoice_number: string
          title: string
          description?: string | null
          items: Json
          subtotal: number
          tax_rate?: number
          tax_amount: number
          total: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date?: string | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          budget_id?: string | null
          invoice_number?: string
          title?: string
          description?: string | null
          items?: Json
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date?: string | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      social_posts: {
        Row: {
          id: string
          property_id: string
          media_id: string | null
          platform: 'instagram' | 'facebook' | 'tiktok' | 'youtube'
          content: string | null
          hashtags: string[] | null
          scheduled_at: string | null
          published_at: string | null
          status: 'draft' | 'scheduled' | 'published' | 'failed'
          external_post_id: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          media_id?: string | null
          platform: 'instagram' | 'facebook' | 'tiktok' | 'youtube'
          content?: string | null
          hashtags?: string[] | null
          scheduled_at?: string | null
          published_at?: string | null
          status?: 'draft' | 'scheduled' | 'published' | 'failed'
          external_post_id?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          media_id?: string | null
          platform?: 'instagram' | 'facebook' | 'tiktok' | 'youtube'
          content?: string | null
          hashtags?: string[] | null
          scheduled_at?: string | null
          published_at?: string | null
          status?: 'draft' | 'scheduled' | 'published' | 'failed'
          external_post_id?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      email_templates: {
        Row: {
          id: string
          name: string
          subject: string
          content: string
          category: 'introduccion' | 'servicios' | 'social' | 'promocion' | 'newsletter' | 'custom'
          variables: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subject: string
          content: string
          category: 'introduccion' | 'servicios' | 'social' | 'promocion' | 'newsletter' | 'custom'
          variables?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subject?: string
          content?: string
          category?: 'introduccion' | 'servicios' | 'social' | 'promocion' | 'newsletter' | 'custom'
          variables?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      email_campaigns: {
        Row: {
          id: string
          name: string
          subject: string
          content: string
          template_id: string | null
          status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
          scheduled_at: string | null
          sent_at: string | null
          total_recipients: number
          total_sent: number
          total_opened: number
          total_clicked: number
          total_bounced: number
          total_unsubscribed: number
          open_rate: number
          click_rate: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subject: string
          content: string
          template_id?: string | null
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
          scheduled_at?: string | null
          sent_at?: string | null
          total_recipients?: number
          total_sent?: number
          total_opened?: number
          total_clicked?: number
          total_bounced?: number
          total_unsubscribed?: number
          open_rate?: number
          click_rate?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subject?: string
          content?: string
          template_id?: string | null
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
          scheduled_at?: string | null
          sent_at?: string | null
          total_recipients?: number
          total_sent?: number
          total_opened?: number
          total_clicked?: number
          total_bounced?: number
          total_unsubscribed?: number
          open_rate?: number
          click_rate?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      email_recipients: {
        Row: {
          id: string
          campaign_id: string
          email: string
          user_id: string | null
          status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed'
          sent_at: string | null
          opened_at: string | null
          clicked_at: string | null
          open_count: number
          click_count: number
          user_agent: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          email: string
          user_id?: string | null
          status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed'
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          open_count?: number
          click_count?: number
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          email?: string
          user_id?: string | null
          status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed'
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          open_count?: number
          click_count?: number
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
      }
      email_subscribers: {
        Row: {
          id: string
          email: string
          name: string | null
          company: string | null
          source: string
          tags: string[]
          is_subscribed: boolean
          subscribed_at: string
          unsubscribed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          company?: string | null
          source?: string
          tags?: string[]
          is_subscribed?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          company?: string | null
          source?: string
          tags?: string[]
          is_subscribed?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Property = Database['public']['Tables']['properties']['Row']
export type Media = Database['public']['Tables']['media']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type SocialPost = Database['public']['Tables']['social_posts']['Row']
export type EmailTemplate = Database['public']['Tables']['email_templates']['Row']
export type EmailCampaign = Database['public']['Tables']['email_campaigns']['Row']
export type EmailRecipient = Database['public']['Tables']['email_recipients']['Row']
export type EmailSubscriber = Database['public']['Tables']['email_subscribers']['Row']
