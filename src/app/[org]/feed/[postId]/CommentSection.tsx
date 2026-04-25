'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Comment {
  id: string
  body: string
  created_at: string
  members: { id: string; display_name: string | null; avatar_url: string | null } | null
}

interface Props {
  org: string
  postId: string
  initialComments: Comment[]
  myMemberId: string
}

export default function CommentSection({ org, postId, initialComments, myMemberId }: Props) {
  const [comments, setComments] = useState(initialComments)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setPosting(true)
    try {
      const res = await fetch(`/api/orgs/${org}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (res.ok) {
        const comment = await res.json()
        setComments(c => [...c, comment])
        setBody('')
      }
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E4E0D8]">
      <div className="px-4 py-3 border-b border-[#E4E0D8]">
        <h3 className="font-bold text-[#1C1A16] text-sm">コメント ({comments.length})</h3>
      </div>

      {comments.length === 0 ? (
        <div className="px-4 py-6 text-center text-[#9C9688] text-sm">まだコメントがありません</div>
      ) : (
        <div className="divide-y divide-[#F7F5F0]">
          {comments.map(c => {
            const m = c.members
            return (
              <div key={c.id} className="flex gap-3 px-4 py-3">
                <Link href={`/${org}/profile/${m?.id}`} className="shrink-0">
                  {m?.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#FEFAE0] flex items-center justify-center">
                      <span className="material-symbols-rounded text-[12px] text-[#B8A000]">person</span>
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <Link href={`/${org}/profile/${m?.id}`} className="text-sm font-medium text-[#1C1A16] hover:text-[#F2D400]">{m?.display_name}</Link>
                    <span className="text-xs text-[#9C9688]">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-[#1C1A16] mt-0.5">{c.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2 px-4 py-3 border-t border-[#E4E0D8]">
        <input
          type="text"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="コメントを追加..."
          className="flex-1 border border-[#E4E0D8] px-3 py-2 text-sm outline-none focus:border-[#F2D400]"
        />
        <button
          type="submit"
          disabled={posting || !body.trim()}
          className="bg-[#F2D400] text-[#1C1A16] font-ui font-semibold px-4 py-2 text-sm hover:bg-[#B8A000] disabled:opacity-50"
        >
          送信
        </button>
      </form>
    </div>
  )
}
