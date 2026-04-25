'use client'

import { useState } from 'react'

interface Props {
  org: string
  shopId: string
  memberId: string
  initialWished: boolean
  initialWishCount: number
}

export default function ShopDetailClient({ org, shopId, memberId, initialWished, initialWishCount }: Props) {
  const [wished, setWished] = useState(initialWished)
  const [wishCount, setWishCount] = useState(initialWishCount)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      if (wished) {
        await fetch(`/api/orgs/${org}/wishlist/${shopId}`, { method: 'DELETE' })
        setWished(false)
        setWishCount(c => c - 1)
      } else {
        await fetch(`/api/orgs/${org}/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shopId }),
        })
        setWished(true)
        setWishCount(c => c + 1)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`mt-3 flex items-center gap-2 text-sm font-ui font-medium px-4 py-2 border transition-colors disabled:opacity-50 ${
        wished
          ? 'bg-[#F2D400] border-[#B8A000] text-[#1C1A16]'
          : 'bg-[#FFFFFF] border-[#E4E0D8] text-[#9C9688] hover:border-[#F2D400] hover:text-[#1C1A16]'
      }`}
    >
      <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: wished ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
      {wished ? 'ウィッシュリストに追加済み' : 'ウィッシュリストに追加'}
    </button>
  )
}
