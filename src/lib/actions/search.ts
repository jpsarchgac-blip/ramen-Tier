'use server'

import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { TierLevel } from '@/types/database'

export async function searchShops(orgSlug: string, payload: { area: string; freeText: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', candidates: [] }

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) return { error: 'Not found', candidates: [] }

  const { data: ratings } = await supabase
    .from('tier_ratings')
    .select('tier, ramen_shops(id, name, address, google_place_id, photo_url, ramen_type)')
    .eq('organization_id', org.id)

  const shopMap: Record<string, { shop: any; tiers: Record<TierLevel, number> }> = {}

  for (const r of ratings ?? []) {
    const shop = r.ramen_shops as any
    if (!shop || !r.tier) continue
    if (payload.area && shop.address && !shop.address.includes(payload.area)) continue

    if (!shopMap[shop.id]) {
      shopMap[shop.id] = { shop, tiers: { S: 0, A: 0, B: 0, C: 0, D: 0 } }
    }
    shopMap[shop.id].tiers[r.tier as TierLevel]++
  }

  const candidates = Object.values(shopMap)
    .sort((a, b) => {
      const scoreA = a.tiers.S * 5 + a.tiers.A * 4 + a.tiers.B * 3 + a.tiers.C
      const scoreB = b.tiers.S * 5 + b.tiers.A * 4 + b.tiers.B * 3 + b.tiers.C
      return scoreB - scoreA
    })
    .slice(0, 5)

  if (candidates.length === 0) return { candidates: [] }

  let aiResults = candidates.map(c => ({
    shop: {
      id: c.shop.id,
      name: c.shop.name,
      address: c.shop.address,
      google_place_id: c.shop.google_place_id,
      photo_url: c.shop.photo_url,
    },
    communityScore: c.tiers,
    aiExplanation: '',
  }))

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const shopDataStr = candidates.map(c =>
      `- ${c.shop.name}（${c.shop.address ?? 'エリア不明'}）: S${c.tiers.S}人 A${c.tiers.A}人 B${c.tiers.B}人 C${c.tiers.C}人 D${c.tiers.D}人`
    ).join('\n')

    const prompt = `あなたはラーメンの専門家です。以下のコミュニティメンバーの評価データをもとに、ユーザーの要望に最も合うラーメン屋を選び、各店舗についてその理由を日本語50〜100文字で説明してください。

ユーザーの要望: ${payload.freeText}
エリア: ${payload.area || '指定なし'}

候補店舗:
${shopDataStr}

以下のJSON形式で返してください（他のテキストは不要）:
{"explanations": ["店1の説明", "店2の説明", "店3の説明", "店4の説明", "店5の説明"]}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      parsed.explanations?.forEach((exp: string, i: number) => {
        if (aiResults[i]) aiResults[i].aiExplanation = exp
      })
    }
  } catch {
    // AI failed — return results without explanation
  }

  return { candidates: aiResults }
}
