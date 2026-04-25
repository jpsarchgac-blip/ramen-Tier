'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { TIER_COLORS, getGoogleMapsUrl } from '@/lib/utils'
import type { TierLevel } from '@/types/database'
import HelpTooltip from '@/components/HelpTooltip'
import { searchShops } from '@/lib/actions/search'

interface SearchResult {
  shop: {
    id: string
    name: string
    address: string | null
    google_place_id: string | null
    photo_url: string | null
  }
  communityScore: Record<TierLevel, number>
  aiExplanation: string
}

export default function SearchPage() {
  const { org } = useParams<{ org: string }>()
  const [area, setArea] = useState('')
  const [freeText, setFreeText] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!freeText.trim()) return
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const data = await searchShops(org, { area, freeText })
      if (data.error) throw new Error('検索に失敗しました')
      setResults(data.candidates)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-bold text-[#1C1A16] text-xl mb-1 flex items-center gap-2">
          AIラーメン検索
          <HelpTooltip text="コミュニティメンバーの評価データをGemini AIが分析し、あなたの要望に最もマッチするお店を提案します。自然な言葉で検索できます。" position="bottom" />
        </h1>
        <p className="text-sm text-[#9C9688]">コミュニティデータをもとにAIがおすすめを提案します</p>
      </div>

      <form onSubmit={handleSearch} className="bg-[#FFFFFF] border border-[#E4E0D8] p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1C1A16] mb-1 flex items-center gap-1.5">
            エリア <span className="text-[#9C9688] font-normal text-xs">任意</span>
            <HelpTooltip text="特定のエリアに絞り込みたい場合に入力してください。例:「渋谷周辺」「新宿」など。空欄のままでも検索できます。" position="right" />
          </label>
          <input
            type="text"
            value={area}
            onChange={e => setArea(e.target.value)}
            placeholder="例: 渋谷周辺"
            className="w-full border border-[#E4E0D8] px-3 py-2 text-sm outline-none focus:border-[#F2D400]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1C1A16] mb-1 flex items-center gap-1.5">
            食べたいもの <span className="text-[#E8593C]">*</span>
            <HelpTooltip text="食べたいラーメンの特徴を自由に入力してください。例:「こってり系で麺が太いやつ」「あっさりした魚介系」など。AIがコミュニティデータと照合します。" position="right" />
          </label>
          <textarea
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            placeholder="例: こってり系で麺が太いやつ"
            rows={2}
            required
            className="w-full border border-[#E4E0D8] px-3 py-2 text-sm outline-none focus:border-[#F2D400] resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !freeText.trim()}
          className="w-full bg-[#F2D400] text-[#1C1A16] font-ui font-bold py-3 text-sm hover:bg-[#B8A000] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-rounded text-[18px]">search</span>
          {loading ? 'AIが検索中...' : 'AIで検索する'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {loading && (
        <div className="text-center py-8 text-[#9C9688]">
          <div className="text-2xl mb-2">🍜</div>
          <p className="text-sm">AIがコミュニティデータを分析中...</p>
        </div>
      )}

      {results !== null && (
        <div>
          <h2 className="font-bold text-[#1C1A16] mb-3">検索結果 ({results.length}件)</h2>
          {results.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-6 text-center text-[#9C9688] text-sm">
              該当する店舗が見つかりませんでした
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r, i) => {
                const mapsUrl = getGoogleMapsUrl(r.shop.google_place_id, r.shop.name, r.shop.address)
                const total = Object.values(r.communityScore).reduce((a, b) => a + b, 0)
                return (
                  <div key={r.shop.id} className="bg-[#FFFFFF] border border-[#E4E0D8] overflow-hidden">
                    <div className="flex gap-3 p-4">
                      {/* Rank */}
                      <div className="shrink-0 w-8 h-8 flex items-center justify-center bg-[#F2D400] font-ui font-bold text-[#1C1A16]">
                        {i + 1}
                      </div>
                      {/* Photo */}
                      {r.shop.photo_url ? (
                        <img src={r.shop.photo_url} alt={r.shop.name} className="w-16 h-16 object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 bg-[#FEFAE0] shrink-0 flex items-center justify-center text-2xl">🍜</div>
                      )}
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#1C1A16]">{r.shop.name}</h3>
                        {r.shop.address && <p className="text-xs text-[#9C9688] mt-0.5 truncate">{r.shop.address}</p>}
                        {/* Tier mini-bar */}
                        <div className="flex items-center gap-1 mt-2">
                          {(['S', 'A', 'B', 'C', 'D'] as TierLevel[]).map(tier => {
                            const count = r.communityScore[tier]
                            if (count === 0) return null
                            return (
                              <span
                                key={tier}
                                className="font-ui text-xs px-1.5 py-0.5 text-white font-bold"
                                style={{ background: TIER_COLORS[tier] }}
                              >
                                {tier} {count}
                              </span>
                            )
                          })}
                          <span className="text-xs text-[#9C9688] ml-1">{total}人評価</span>
                        </div>
                      </div>
                    </div>

                    {/* AI explanation */}
                    {r.aiExplanation && (
                      <div className="px-4 pb-3 border-t border-[#F7F5F0] pt-3">
                        <p className="text-xs text-[#9C9688] mb-1 flex items-center gap-1">
                          <span className="material-symbols-rounded text-[14px]">auto_awesome</span>
                          AIのコメント
                        </p>
                        <p className="text-sm text-[#1C1A16]">{r.aiExplanation}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="px-4 pb-4 flex gap-2">
                      <Link
                        href={`/${org}/shops/${r.shop.id}`}
                        className="flex items-center gap-1 text-xs font-ui font-medium text-[#1C1A16] border border-[#E4E0D8] px-3 py-1.5 hover:bg-[#F7F5F0]"
                      >
                        詳細を見る
                        <span className="material-symbols-rounded text-[12px]">chevron_right</span>
                      </Link>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-ui font-medium text-[#9C9688] border border-[#E4E0D8] px-3 py-1.5 hover:bg-[#F7F5F0]"
                      >
                        <span className="material-symbols-rounded text-[14px]">place</span>
                        Google Maps
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
