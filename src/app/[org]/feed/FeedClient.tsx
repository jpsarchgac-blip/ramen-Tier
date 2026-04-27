'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import PostCard from '@/components/PostCard'
import HelpTooltip from '@/components/HelpTooltip'

const PostCreateModal = dynamic(() => import('@/components/PostCreateModal'), { ssr: false })
const BgmPlayer = dynamic(() => import('@/components/BgmPlayer'), { ssr: false })

interface FeedClientProps {
  org: string
  initialPosts: any[]
  myMemberId: string
  bgmUrl: string | null
  bgmVolume: number
}

export default function FeedClient({ org, initialPosts, myMemberId, bgmUrl, bgmVolume }: FeedClientProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(initialPosts.length === 0)

  const loadPosts = async () => {
    const supabase = createClient()
    const { data: orgData } = await supabase
      .from('organizations').select('id').eq('slug', org).single()
    if (!orgData) return

    const { data, error } = await supabase
      .from('posts')
      .select('*, members(id, display_name, avatar_url), ramen_shops(id, name), post_likes(member_id), post_comments(id)')
      .eq('organization_id', orgData.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      // fallback without like/comment counts
      const { data: fallback } = await supabase
        .from('posts')
        .select('*, members(id, display_name, avatar_url), ramen_shops(id, name)')
        .eq('organization_id', orgData.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (fallback) setPosts(fallback.map(p => ({ ...p, post_likes: [], post_comments: [] })))
    } else if (data) {
      setPosts(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPosts()
  }, [org])

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-[#1C1A16] text-xl">ラーメンインスタ</h1>
          <HelpTooltip text="コミュニティメンバーが投稿したラーメン写真を見られるフィードです。いいねやコメントで盛り上がりましょう。BGMを設定するとお店の雰囲気を演出できます。" position="bottom" />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#F2D400] text-[#1C1A16] font-ui font-semibold text-sm px-4 py-2 hover:bg-[#B8A000] flex items-center gap-1"
        >
          <span className="material-symbols-rounded text-[18px]">add</span>
          投稿
        </button>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-8 text-center text-[#9C9688]">
          <span className="material-symbols-rounded text-[32px] text-[#E4E0D8] mb-2">sync</span>
          <p className="text-sm">読み込み中...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-8 text-center text-[#9C9688]">
          <span className="material-symbols-rounded text-[48px] text-[#9C9688] mb-2">photo_camera</span>
          <p className="text-sm">まだ投稿がありません。最初の投稿をしてみましょう！</p>
        </div>
      ) : (
        posts.map((post: any) => (
          <PostCard key={post.id} post={post} org={org} myMemberId={myMemberId} />
        ))
      )}

      {showCreate && (
        <PostCreateModal org={org} onClose={() => setShowCreate(false)} onPosted={loadPosts} />
      )}

      {bgmUrl && (
        <BgmPlayer bgmUrl={bgmUrl} defaultVolume={bgmVolume} />
      )}
    </div>
  )
}
