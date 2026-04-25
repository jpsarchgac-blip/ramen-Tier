export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type TierLevel = 'S' | 'A' | 'B' | 'C' | 'D'
export type MemberRole = 'owner' | 'admin' | 'member'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at'>
        Update: Partial<Omit<Organization, 'id' | 'created_at'>>
      }
      members: {
        Row: Member
        Insert: Omit<Member, 'id' | 'joined_at'>
        Update: Partial<Omit<Member, 'id' | 'joined_at'>>
      }
      ramen_shops: {
        Row: RamenShop
        Insert: Omit<RamenShop, 'id' | 'created_at'>
        Update: Partial<Omit<RamenShop, 'id' | 'created_at'>>
      }
      tier_ratings: {
        Row: TierRating
        Insert: Omit<TierRating, 'id'>
        Update: Partial<Omit<TierRating, 'id'>>
      }
      wish_list: {
        Row: WishList
        Insert: Omit<WishList, 'id' | 'created_at'>
        Update: Partial<Omit<WishList, 'id' | 'created_at'>>
      }
      posts: {
        Row: Post
        Insert: Omit<Post, 'id' | 'created_at'>
        Update: Partial<Omit<Post, 'id' | 'created_at'>>
      }
      post_likes: {
        Row: PostLike
        Insert: PostLike
        Update: Partial<PostLike>
      }
      post_comments: {
        Row: PostComment
        Insert: Omit<PostComment, 'id' | 'created_at'>
        Update: Partial<Omit<PostComment, 'id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export interface Organization {
  id: string
  name: string
  slug: string
  allowed_domain: string
  bgm_url: string | null
  bgm_enabled: boolean
  bgm_volume: number
  created_at: string
}

export interface Member {
  id: string
  user_id: string
  organization_id: string
  role: MemberRole
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  favorite_types: string[] | null
  favorite_shop_id: string | null
  tier_public: boolean
  is_setup_done: boolean
  joined_at: string
}

export interface RamenShop {
  id: string
  organization_id: string
  google_place_id: string | null
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  ramen_type: string[] | null
  photo_url: string | null
  added_by: string
  created_at: string
}

export interface TierRating {
  id: string
  member_id: string
  shop_id: string
  organization_id: string
  tier: TierLevel | null
  score_noodle: number | null
  score_soup: number | null
  score_toppings: number | null
  score_wait: number | null
  score_speed: number | null
  score_location: number | null
  highlights: string[] | null
  comment: string | null
  updated_at: string
}

export interface WishList {
  id: string
  member_id: string
  shop_id: string
  organization_id: string
  created_at: string
}

export interface Post {
  id: string
  member_id: string
  organization_id: string
  shop_id: string | null
  caption: string | null
  ramen_type: string | null
  image_urls: string[] | null
  created_at: string
}

export interface PostLike {
  post_id: string
  member_id: string
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  member_id: string
  body: string
  created_at: string
}

// Extended types with joins
export interface TierRatingWithShop extends TierRating {
  ramen_shops: RamenShop
}

export interface TierRatingWithMember extends TierRating {
  members: Member
}

export interface PostWithMember extends Post {
  members: Member
  ramen_shops: RamenShop | null
  post_likes: PostLike[]
  post_comments: PostComment[]
}

export interface MemberWithStats extends Member {
  shop_count: number
  wish_count: number
  post_count: number
}

export interface ShopWithStats extends RamenShop {
  tier_distribution: Record<TierLevel, number>
  avg_noodle: number | null
  avg_soup: number | null
  avg_toppings: number | null
  avg_wait: number | null
  avg_speed: number | null
  avg_location: number | null
  wish_count: number
  rating_count: number
}
