'use client'

import { RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

interface RadarChartProps {
  data: { subject: string; value: number | null }[]
  color?: string
}

export default function RadarChart({ data, color = '#F2D400' }: RadarChartProps) {
  const filtered = data.filter(d => d.value !== null)
  if (filtered.length < 3) {
    return (
      <div className="flex items-center justify-center h-full text-[#9C9688] text-sm">
        評価データがありません
      </div>
    )
  }

  const chartData = data.map(d => ({ subject: d.subject, value: d.value ?? 0 }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsRadar data={chartData}>
        <PolarGrid stroke="#E4E0D8" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fill: '#9C9688', fontFamily: 'Noto Sans JP' }}
        />
        <Radar
          name="評価"
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.25}
          dot={{ r: 3, fill: color }}
        />
        <Tooltip
          formatter={(value) => [typeof value === 'number' ? value.toFixed(1) : value, '評価']}
          contentStyle={{ fontSize: 12, border: '1px solid #E4E0D8', borderRadius: 0 }}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  )
}
