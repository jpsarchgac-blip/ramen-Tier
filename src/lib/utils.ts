import type { TierLevel } from '@/types/database'

export const TIER_LABELS: Record<TierLevel, string> = {
  S: '殿堂入り・また絶対行く',
  A: 'かなり好き・おすすめできる',
  B: '普通においしい',
  C: 'まあまあ・好みが分かれる',
  D: '自分には合わなかった',
}

export const TIER_COLORS: Record<TierLevel, string> = {
  S: '#D4AF37',
  A: '#A8A9AD',
  B: '#A0522D',
  C: '#7A7A7A',
  D: '#2C2C2C',
}

export const TIER_BG_CLASSES: Record<TierLevel, string> = {
  S: 'bg-[#D4AF37]',
  A: 'bg-[#A8A9AD]',
  B: 'bg-[#A0522D]',
  C: 'bg-[#7A7A7A]',
  D: 'bg-[#2C2C2C]',
}

export const TIER_TEXT_CLASSES: Record<TierLevel, string> = {
  S: 'text-[#1C1A16]',
  A: 'text-[#1C1A16]',
  B: 'text-white',
  C: 'text-white',
  D: 'text-white',
}

export const RAMEN_TYPES = ['醤油', '味噌', '豚骨', '塩', 'つけ麺', '担々麺', 'その他']

export const HIGHLIGHT_OPTIONS = [
  'スープが絶品',
  '麺のコシ',
  'コスパ最高',
  '接客が良い',
  '雰囲気が良い',
  '限定メニュー',
  'ボリューム満点',
  '行列必至の人気店',
]

export const TIER_LEVELS: TierLevel[] = ['S', 'A', 'B', 'C', 'D']

export function getGoogleMapsUrl(placeId: string | null, name: string, address: string | null): string {
  if (placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`
  }
  const query = encodeURIComponent(`${name}${address ? ' ' + address : ''}`)
  return `https://www.google.com/maps/search/${query}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
