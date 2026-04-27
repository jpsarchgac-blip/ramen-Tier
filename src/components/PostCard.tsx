'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate, TIER_COLORS } from '@/lib/utils'
import type { TierLevel } from '@/types/database'

interface PostCardProps {
  post: {
    id: string
    caption: string | null
    image_urls: string[] | null
    created_at: string
    ramen_type: string | null
    members: { id: string; display_name: string | null; avatar_url: string | null } | null
    ramen_shops: { id: string; name: string } | null
    post_likes: { member_id: string }[]
    post_comments: { id: string }[]
    tier?: string | null
  }
  org: string
  myMemberId: string
}

export default function PostCard({ post, org, myMemberId }: PostCardProps) {
  const [liked, setLiked] = useState(post.post_likes.some(l => l.member_id === myMemberId))
  const [likeCount, setLikeCount] = useState(post.post_likes.length)
  const [imgIndex, setImgIndex] = useState(0)
  const [bouncing, setBouncing] = useState(false)
  const images = post.image_urls ?? []
  const member = post.members

  const handleToggleLike = async () => {
    const next = !liked
    setLiked(next)
    setLikeCount(c => c + (next ? 1 : -1))
    if (next) {
      setBouncing(true)
      setTimeout(() => setBouncing(false), 400)
    }
    const method = next ? 'POST' : 'DELETE'
    await fetch(`/api/orgs/${org}/posts/${post.id}/like`, { method })
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E4E0D8]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2 group">
          {member?.id ? (
            <Link href={`/${org}/profile/${member.id}`} className="flex items-center gap-2 group">
              {member.avatar_url ? (
                <Image src={member.avatar_url} alt="" width={32} height={32} className="rounded-full object-cover group-hover:ring-2 ring-[#F2D400]" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#FEFAE0] flex items-center justify-center group-hover:ring-2 ring-[#F2D400]">
                  <span className="material-symbols-rounded text-[14px] text-[#B8A000]">person</span>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-[#1C1A16] group-hover:text-[#F2D400]">{member.display_name}</div>
                {post.ramen_shops && (
                  <Link
                    href={`/${org}/shops/${post.ramen_shops.id}`}
                    onClick={e => e.stopPropagation()}
                    className="text-xs text-[#9C9688] hover:text-[#1C1A16]"
                  >
                    {post.ramen_shops.name}
                  </Link>
                )}
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FEFAE0] flex items-center justify-center">
                <span className="material-symbols-rounded text-[14px] text-[#B8A000]">person</span>
              </div>
              <div className="text-sm text-[#9C9688]">—</div>
            </div>
          )}
        </div>
        <span className="text-xs text-[#9C9688]">{formatDate(post.created_at)}</span>
      </div>

      {/* Image */}
      {images.length > 0 && (
        <div className="relative aspect-[4/3] overflow-hidden bg-[#F7F5F0]">
          <Image
            src={images[imgIndex]}
            alt=""
            fill
            className="object-cover transition-transform duration-300"
            sizes="(max-width: 512px) 100vw, 512px"
          />
          {images.length > 1 && (
            <>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1"
                onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
              >
                <span className="material-symbols-rounded text-[16px]">chevron_left</span>
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1"
                onClick={() => setImgIndex(i => (i + 1) % images.length)}
              >
                <span className="material-symbols-rounded text-[16px]">chevron_right</span>
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIndex ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-3 py-2 flex items-center gap-3">
        <button
          onClick={handleToggleLike}
          className={`flex items-center gap-1 text-sm transition-colors ${liked ? 'text-[#E8593C]' : 'text-[#9C9688] hover:text-[#E8593C]'}`}
        >
          <span
            className={`material-symbols-rounded text-[20px] ${bouncing ? 'animate-like-bounce' : ''}`}
            style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
          <span className="font-ui font-medium">{likeCount}</span>
        </button>
        <Link
          href={`/${org}/feed/${post.id}`}
          className="flex items-center gap-1 text-sm text-[#9C9688] hover:text-[#1C1A16]"
        >
          <span className="material-symbols-rounded text-[20px]">chat_bubble</span>
          <span className="font-ui font-medium">{post.post_comments.length}</span>
        </Link>
        {post.ramen_type && (
          <span className="ml-auto bg-[#FEFAE0] border border-[#F2D400] text-[#1C1A16] text-xs px-2 py-0.5">{post.ramen_type}</span>
        )}
        {post.tier && (
          <span
            className="font-ui font-bold text-xs px-2 py-0.5 text-white"
            style={{ background: TIER_COLORS[post.tier as TierLevel] }}
          >
            {post.tier}
          </span>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-3 pb-3 text-sm text-[#1C1A16]">
          <span className="font-medium">{member?.display_name}</span>
          {' '}{post.caption}
        </div>
      )}
    </div>
  )
}
