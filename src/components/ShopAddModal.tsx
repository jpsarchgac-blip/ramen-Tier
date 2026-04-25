'use client'

import { useState, useRef, useEffect } from 'react'
import { TIER_LEVELS, TIER_COLORS, HIGHLIGHT_OPTIONS, RAMEN_TYPES } from '@/lib/utils'
import type { TierLevel } from '@/types/database'
import HelpTooltip from '@/components/HelpTooltip'
import { upsertTier } from '@/lib/actions/tiers'

interface PlaceInfo {
  placeId: string | null
  name: string
  address: string
  lat: number | null
  lng: number | null
  photoUrl: string | null
  ramenTypes: string[]
}

interface ShopAddModalProps {
  org: string
  onClose: () => void
  onSaved: () => void
  initialShop?: {
    placeId: string | null
    name: string
    address: string
    lat: number | null
    lng: number | null
    photoUrl: string | null
    ramenTypes: string[]
  }
}

type Step = 1 | 2 | 3 | 4

export default function ShopAddModal({ org, onClose, onSaved, initialShop }: ShopAddModalProps) {
  const hasInitial = !!initialShop
  const [step, setStep] = useState<Step>(hasInitial ? 2 : 1)
  const [place, setPlace] = useState<PlaceInfo | null>(
    initialShop
      ? { ...initialShop }
      : null
  )
  const [tier, setTier] = useState<TierLevel | null>(null)
  const [scores, setScores] = useState({
    noodle: null as number | null,
    soup: null as number | null,
    toppings: null as number | null,
    wait: null as number | null,
    speed: null as number | null,
    location: null as number | null,
  })
  const [highlights, setHighlights] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [ramenTypes, setRamenTypes] = useState<string[]>(initialShop?.ramenTypes ?? [])

  // Google Maps Places Autocomplete
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [mapsReady, setMapsReady] = useState(false)

  useEffect(() => {
    if (!mapsApiKey || typeof window === 'undefined' || hasInitial) return
    if (window.google?.maps?.places) {
      setMapsReady(true)
      return
    }
    // Check if script is already loading
    if (document.querySelector('script[data-gmaps]')) return

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places&language=ja`
    script.async = true
    script.setAttribute('data-gmaps', '1')
    script.onload = () => setMapsReady(true)
    document.head.appendChild(script)
  }, [mapsApiKey, hasInitial])

  useEffect(() => {
    if (!mapsReady || !inputRef.current || step !== 1) return
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment'],
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'photos'],
    })
    autocompleteRef.current = ac
    ac.addListener('place_changed', () => {
      const p = ac.getPlace()
      if (!p.name) return
      const photoUrl = p.photos?.[0]?.getUrl({ maxWidth: 400 }) ?? null
      setPlace({
        placeId: p.place_id ?? null,
        name: p.name,
        address: p.formatted_address ?? '',
        lat: p.geometry?.location?.lat() ?? null,
        lng: p.geometry?.location?.lng() ?? null,
        photoUrl,
        ramenTypes,
      })
    })
  }, [mapsReady, step])

  const handleManualPlace = () => {
    if (!searchQuery.trim()) return
    setPlace({
      placeId: null,
      name: searchQuery.trim(),
      address: '',
      lat: null,
      lng: null,
      photoUrl: null,
      ramenTypes,
    })
    setStep(2)
  }

  const handlePlaceSelected = () => {
    if (!place) return
    setPlace(p => p ? { ...p, ramenTypes } : p)
    setStep(2)
  }

  const setScore = (key: keyof typeof scores, val: number | null) =>
    setScores(prev => ({ ...prev, [key]: val }))

  const toggleHighlight = (h: string) =>
    setHighlights(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])

  const toggleRamenType = (t: string) =>
    setRamenTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleSave = async () => {
    if (!place || !tier) return
    setSaving(true)
    try {
      const result = await upsertTier(org, {
        shop: { ...place, ramenTypes },
        tier,
        scores,
        highlights,
        comment,
      })
      if (!result.error) {
        onSaved()
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  const ScoreSlider = ({ label, scoreKey }: { label: string; scoreKey: keyof typeof scores }) => {
    const val = scores[scoreKey]
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#1C1A16] w-20 shrink-0">{label}</span>
        <div className="flex items-center gap-2 flex-1">
          <input
            type="checkbox"
            checked={val !== null}
            onChange={e => setScore(scoreKey, e.target.checked ? 5.0 : null)}
            className="shrink-0"
          />
          <input
            type="range"
            min={0} max={10} step={0.5}
            value={val ?? 5}
            disabled={val === null}
            onChange={e => setScore(scoreKey, parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="font-ui text-sm text-[#1C1A16] w-8 text-right">
            {val !== null ? val.toFixed(1) : '—'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#FFFFFF] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E4E0D8]">
          <h2 className="font-bold text-[#1C1A16]">
            {step === 1 && '店舗を選択'}
            {step === 2 && 'Tierを選択'}
            {step === 3 && '詳細評価を入力'}
            {step === 4 && '一押し・コメント'}
          </h2>
          <button onClick={onClose} className="text-[#9C9688] hover:text-[#1C1A16]">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-4 pt-3 gap-1">
          {(hasInitial ? [2, 3, 4] : [1, 2, 3, 4]).map(s => (
            <div key={s} className={`h-1 flex-1 transition-colors ${s <= step ? 'bg-[#F2D400]' : 'bg-[#E4E0D8]'}`} />
          ))}
        </div>

        <div className="p-4">
          {/* Step 1: Shop search */}
          {step === 1 && (
            <div className="space-y-4">
              {mapsApiKey ? (
                /* Google Places Autocomplete mode */
                <div>
                  <label className="block text-sm font-medium text-[#1C1A16] mb-1">店舗名で検索</label>
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="例: ○○ラーメン 渋谷店"
                      className="flex-1 border border-[#E4E0D8] px-3 py-2 text-sm outline-none focus:border-[#F2D400]"
                      onChange={e => {
                        if (!autocompleteRef.current) {
                          setSearchQuery(e.target.value)
                          setPlace(null)
                        }
                      }}
                    />
                    <button
                      onClick={place ? handlePlaceSelected : handleManualPlace}
                      disabled={!place && !inputRef.current?.value.trim()}
                      className="bg-[#F2D400] text-[#1C1A16] font-ui font-semibold px-4 py-2 text-sm hover:bg-[#B8A000] disabled:opacity-50"
                    >
                      次へ
                    </button>
                  </div>
                  {place && (
                    <div className="mt-2 flex items-center gap-2 bg-[#FEFAE0] border border-[#F2D400] p-2 text-sm">
                      <span className="material-symbols-rounded text-[16px] text-[#F2D400]">check_circle</span>
                      <span className="font-medium text-[#1C1A16]">{place.name}</span>
                      {place.address && <span className="text-[#9C9688] text-xs truncate">{place.address}</span>}
                    </div>
                  )}
                  <p className="text-xs text-[#9C9688] mt-1">Google Mapsのデータから自動取得します</p>
                </div>
              ) : (
                /* Manual input mode */
                <div>
                  <label className="block text-sm font-medium text-[#1C1A16] mb-1">店舗名</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleManualPlace()}
                      placeholder="例: ○○ラーメン 渋谷店"
                      className="flex-1 border border-[#E4E0D8] px-3 py-2 text-sm outline-none focus:border-[#F2D400]"
                    />
                    <button
                      onClick={handleManualPlace}
                      disabled={!searchQuery.trim()}
                      className="bg-[#F2D400] text-[#1C1A16] font-ui font-semibold px-4 py-2 text-sm hover:bg-[#B8A000] disabled:opacity-50"
                    >
                      次へ
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1C1A16] mb-1">住所（任意）</label>
                <input
                  type="text"
                  placeholder="例: 渋谷区〇〇1-2-3"
                  className="w-full border border-[#E4E0D8] px-3 py-2 text-sm outline-none focus:border-[#F2D400]"
                  onChange={e => {
                    if (place) setPlace(p => p ? { ...p, address: e.target.value } : null)
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1A16] mb-2">ラーメンの種類（任意）</label>
                <div className="flex flex-wrap gap-2">
                  {RAMEN_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleRamenType(t)}
                      className={`px-2.5 py-1 text-xs border transition-colors ${
                        ramenTypes.includes(t)
                          ? 'bg-[#F2D400] border-[#B8A000] text-[#1C1A16] font-medium'
                          : 'bg-[#FFFFFF] border-[#E4E0D8] text-[#9C9688]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Tier selection */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-[#9C9688]">
                <strong className="text-[#1C1A16]">{place?.name}</strong> をどのTierに入れますか？
              </p>
              <div className="space-y-2">
                {TIER_LEVELS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    className={`w-full flex items-center gap-3 p-3 border-l-4 border border-[#E4E0D8] transition-all ${
                      tier === t ? 'border-l-[6px] bg-[#FEFAE0]' : 'hover:bg-[#F7F5F0]'
                    }`}
                    style={{ borderLeftColor: TIER_COLORS[t] }}
                  >
                    <span className="font-ui font-bold text-lg w-6" style={{ color: TIER_COLORS[t] }}>{t}</span>
                    <div className="text-left">
                      <div className="text-sm font-medium text-[#1C1A16]">Tier {t}</div>
                      <div className="text-xs text-[#9C9688]">
                        {t === 'S' && '殿堂入り・また絶対行く'}
                        {t === 'A' && 'かなり好き・おすすめできる'}
                        {t === 'B' && '普通においしい'}
                        {t === 'C' && 'まあまあ・好みが分かれる'}
                        {t === 'D' && '自分には合わなかった'}
                      </div>
                    </div>
                    {tier === t && <span className="material-symbols-rounded text-[#F2D400] ml-auto">check_circle</span>}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                {!hasInitial && (
                  <button onClick={() => setStep(1)} className="flex-1 border border-[#E4E0D8] py-2 text-sm text-[#9C9688] hover:bg-[#F7F5F0]">戻る</button>
                )}
                <button
                  onClick={() => setStep(3)}
                  disabled={!tier}
                  className="flex-1 bg-[#F2D400] text-[#1C1A16] font-ui font-semibold py-2 text-sm hover:bg-[#B8A000] disabled:opacity-50"
                >
                  次へ
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Radar chart scores */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-[#9C9688]">チェックを入れたスコアのみ評価に含まれます（任意）</p>
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-[#9C9688] uppercase tracking-wide">ラーメンチャート</p>
                  <HelpTooltip text="麺・汁・具材の3軸でラーメン自体の品質を評価します。チェックを入れた項目だけが評価に含まれ、他のメンバーとの比較チャートに反映されます。" position="right" />
                </div>
                <ScoreSlider label="麺" scoreKey="noodle" />
                <ScoreSlider label="汁" scoreKey="soup" />
                <ScoreSlider label="具材" scoreKey="toppings" />
              </div>
              <hr className="border-[#E4E0D8]" />
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-[#9C9688] uppercase tracking-wide">店チャート</p>
                  <HelpTooltip text="並ぶ時間・提供速度・立地の3軸でお店の使い勝手を評価します。行列が少なく提供が早いほど高スコアになります。" position="right" />
                </div>
                <ScoreSlider label="並ぶ時間" scoreKey="wait" />
                <ScoreSlider label="提供速度" scoreKey="speed" />
                <ScoreSlider label="立地" scoreKey="location" />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep(2)} className="flex-1 border border-[#E4E0D8] py-2 text-sm text-[#9C9688] hover:bg-[#F7F5F0]">戻る</button>
                <button onClick={() => setStep(4)} className="flex-1 bg-[#F2D400] text-[#1C1A16] font-ui font-semibold py-2 text-sm hover:bg-[#B8A000]">次へ</button>
              </div>
            </div>
          )}

          {/* Step 4: Highlights & Comment */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-sm font-medium text-[#1C1A16]">一押しポイント（複数可）</p>
                  <HelpTooltip text="このお店の特に良かった点を選んでください。複数選択可能で、店舗詳細ページで他のメンバーの評価と合わせて表示されます。" position="right" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {HIGHLIGHT_OPTIONS.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => toggleHighlight(h)}
                      className={`px-3 py-1.5 text-xs border transition-colors ${
                        highlights.includes(h)
                          ? 'bg-[#F2D400] border-[#B8A000] text-[#1C1A16] font-medium'
                          : 'bg-[#FFFFFF] border-[#E4E0D8] text-[#9C9688]'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1A16] mb-1">
                  コメント <span className="text-[#9C9688] font-normal text-xs">200文字以内・任意</span>
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  maxLength={200}
                  rows={3}
                  placeholder="自分の言葉でメモ..."
                  className="w-full border border-[#E4E0D8] px-3 py-2 text-sm outline-none focus:border-[#F2D400] resize-none"
                />
                <div className="text-xs text-[#9C9688] text-right mt-0.5">{comment.length}/200</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(3)} className="flex-1 border border-[#E4E0D8] py-2 text-sm text-[#9C9688] hover:bg-[#F7F5F0]">戻る</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-[#F2D400] text-[#1C1A16] font-ui font-bold py-2 text-sm hover:bg-[#B8A000] disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存する'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
