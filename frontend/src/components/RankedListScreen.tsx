import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Brain, MapPin, Clock, ChevronLeft, Download, TrendingUp, Award, Activity, Cpu, Star, CheckCircle } from 'lucide-react'
import type { Candidate, RankingResult } from '../App'

interface Props {
  ranking: RankingResult
  onBack: () => void
}

const CLUSTER_COLORS: Record<string, string> = {
  'embeddings': '#6366f1', 'retrieval': '#6366f1',
  'vector': '#22d3ee', 'faiss': '#22d3ee', 'pinecone': '#22d3ee', 'weaviate': '#22d3ee',
  'python': '#34d399', 'pytorch': '#34d399', 'tensorflow': '#34d399',
  'nlp': '#fbbf24', 'information': '#fbbf24', 'ranking': '#fbbf24',
  'llm': '#f472b6', 'rag': '#f472b6',
}

function getSkillColor(skill: string): string {
  const lower = skill.toLowerCase()
  for (const [key, color] of Object.entries(CLUSTER_COLORS)) {
    if (lower.includes(key)) return color
  }
  return '#94a3b8'
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size / 2) - 8
  const c = 2 * Math.PI * r
  const fill = Math.min(score / 100, 1) * c
  const color = score >= 65 ? '#34d399' : score >= 45 ? '#6366f1' : '#94a3b8'
  const glow = score >= 65 ? '#34d39950' : score >= 45 ? '#6366f150' : 'transparent'
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${fill} ${c - fill}` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-bold leading-none" style={{ color, fontSize: size * 0.22 }}>{score.toFixed(0)}</span>
        <span className="text-ir-slate leading-none mt-0.5" style={{ fontSize: size * 0.12 }}>score</span>
      </div>
    </div>
  )
}

function ScoreBar({ label, value, color, icon }: { label: string; value: number | null; color: string; icon: React.ReactNode }) {
  if (value === null) return (
    <div className="flex items-center gap-3 py-2">
      <div style={{ color: '#334155' }}>{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">{label}</span>
          <span className="text-slate-600 italic font-mono">N/A</span>
        </div>
        <div className="h-1 rounded-full bg-white/4" />
      </div>
    </div>
  )
  const pct = Math.min(100, value)
  return (
    <div className="flex items-center gap-3 py-2">
      <div style={{ color }}>{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-300 font-medium">{label}</span>
          <span className="font-mono font-semibold" style={{ color }}>{value.toFixed(1)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
            style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
          />
        </div>
      </div>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const colors = rank === 1
    ? { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)', text: '#fbbf24' }
    : rank <= 3
    ? { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', text: '#818cf8' }
    : rank <= 10
    ? { bg: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.3)', text: '#22d3ee' }
    : { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: '#64748b' }
  return (
    <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono"
      style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
      #{rank}
    </div>
  )
}

export default function RankedListScreen({ ranking, onBack }: Props) {
  const [selected, setSelected] = useState<Candidate | null>(ranking.results[0] || null)
  const [tab, setTab] = useState<'breakdown' | 'signals' | 'skills'>('breakdown')

  const radarData = selected ? [
    { subject: 'Skill', value: selected.skill_match_score },
    { subject: 'Career', value: selected.career_fit_score },
    { subject: 'Behavioral', value: selected.behavioral_score },
    { subject: 'Semantic', value: selected.semantic_score ?? 0 },
  ] : []

  return (
    <div className="min-h-screen bg-base flex flex-col overflow-hidden">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', top: '-100px', left: '-100px' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)', bottom: 0, right: 0 }} />
      </div>

      {/* Header */}
      <div className="relative z-20 glass border-b border-white/[0.06] px-5 py-3 flex items-center gap-3 flex-wrap">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-ir-slate hover:text-white transition-colors text-sm group">
          <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          New Search
        </button>
        <div className="flex items-center gap-2 pl-1 border-l border-white/10">
          <Brain size={14} className="text-ir-indigo-light" />
          <span className="text-white font-semibold text-sm">IntelliRank</span>
        </div>
        <div className="flex-1 flex flex-wrap gap-1.5">
          {ranking.jd.must_have_clusters.map(c => (
            <span key={c} className="text-[11px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
              {c.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
        <span className="text-ir-slate text-xs font-mono">{ranking.total_candidates.toLocaleString()} · {ranking.elapsed_s}s</span>
        <a href="http://localhost:8000/api/export/csv"
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-ir-indigo/20 text-ir-indigo-light hover:bg-ir-indigo/10 transition-colors">
          <Download size={11} />CSV
        </a>
        <a href="http://localhost:8000/api/export/xlsx"
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-ir-cyan/20 text-ir-cyan hover:bg-ir-cyan/10 transition-colors">
          <Download size={11} />XLSX
        </a>
      </div>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Candidate list */}
        <div className="w-[390px] flex-shrink-0 overflow-y-auto" style={{ borderRight: '1px solid rgba(99,102,241,0.12)' }}>
          <div className="sticky top-0 z-10 px-4 py-2.5 border-b border-white/[0.04]"
            style={{ background: 'rgba(3,10,26,0.92)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-ir-slate uppercase tracking-wider">Ranked Candidates</span>
              <span className="text-[11px] font-mono text-ir-indigo-light">{ranking.results.length} results</span>
            </div>
          </div>

          {ranking.results.map((c, i) => (
            <motion.button key={c.candidate_id} onClick={() => { setSelected(c); setTab('breakdown') }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.012, duration: 0.2 }}
              className="w-full text-left px-4 py-3.5 border-b transition-all"
              style={{
                borderColor: 'rgba(255,255,255,0.04)',
                borderLeft: selected?.candidate_id === c.candidate_id ? '2px solid #6366f1' : '2px solid transparent',
                background: selected?.candidate_id === c.candidate_id ? 'rgba(99,102,241,0.07)' : 'transparent',
              }}
            >
              <div className="flex items-start gap-3">
                <RankBadge rank={i + 1} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-slate-100 text-sm font-semibold truncate">{c.current_title}</p>
                      <p className="text-ir-slate text-[11px] mt-0.5 flex items-center gap-1.5 font-mono">
                        <Clock size={9} />{c.years_experience.toFixed(1)}y
                        <span className="opacity-30">·</span>
                        <MapPin size={9} />{(c.location || c.country || '').split(',')[0]}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold flex-shrink-0"
                      style={{ color: c.final_score >= 65 ? '#34d399' : c.final_score >= 45 ? '#818cf8' : '#94a3b8' }}>
                      {c.final_score.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.skill_names.slice(0, 3).map(s => {
                      const col = getSkillColor(s)
                      return (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                          style={{ color: col, background: `${col}12`, border: `1px solid ${col}25` }}>
                          {s}
                        </span>
                      )
                    })}
                    {c.open_to_work && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5"
                        style={{ color: '#34d399', background: '#34d39912', border: '1px solid #34d39930' }}>
                        <CheckCircle size={8} />open
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div key={selected.candidate_id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto p-5 space-y-4"
            >
              {/* Header card */}
              <div className="glass-card rounded-2xl p-5 flex items-start gap-5">
                <ScoreRing score={selected.final_score} size={86} />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white leading-tight">{selected.current_title}</h2>
                  <p className="text-ir-slate text-xs mt-1 font-mono">{selected.candidate_id}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock size={11} />{selected.years_experience.toFixed(1)} years</span>
                    <span className="flex items-center gap-1"><MapPin size={11} />{selected.location || selected.country}</span>
                    {selected.open_to_work && (
                      <span className="flex items-center gap-1 text-ir-emerald font-semibold">
                        <CheckCircle size={11} />Available now
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {[
                      { l: 'Skill', v: selected.skill_match_score, c: '#6366f1' },
                      { l: 'Career', v: selected.career_fit_score, c: '#22d3ee' },
                      { l: 'Behavioral', v: selected.behavioral_score, c: '#fbbf24' },
                      { l: 'Semantic', v: selected.semantic_score, c: '#34d399' },
                    ].map(s => (
                      <div key={s.l} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                        style={{ background: `${s.c}10`, border: `1px solid ${s.c}25` }}>
                        <span className="text-slate-500">{s.l}</span>
                        <span className="font-mono font-bold" style={{ color: s.c }}>
                          {s.v != null ? s.v.toFixed(0) : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(3,10,26,0.7)', border: '1px solid rgba(99,102,241,0.12)' }}>
                {(['breakdown', 'signals', 'skills'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className="flex-1 py-2 text-xs font-medium rounded-lg transition-all capitalize"
                    style={{
                      background: tab === t ? '#6366f1' : 'transparent',
                      color: tab === t ? 'white' : '#64748b',
                      boxShadow: tab === t ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
                    }}>
                    {t}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {tab === 'breakdown' && (
                  <motion.div key="bd" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="glass-card rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={13} className="text-ir-indigo-light" />
                        <span className="text-[11px] font-mono text-ir-slate uppercase tracking-wider">Score Breakdown</span>
                      </div>
                      <ScoreBar label="Skill Match" value={selected.skill_match_score} color="#6366f1" icon={<Award size={13} />} />
                      <ScoreBar label="Career Fit" value={selected.career_fit_score} color="#22d3ee" icon={<TrendingUp size={13} />} />
                      <ScoreBar label="Behavioral" value={selected.behavioral_score} color="#fbbf24" icon={<Activity size={13} />} />
                      <ScoreBar label="Semantic" value={selected.semantic_score} color="#34d399" icon={<Cpu size={13} />} />
                    </div>

                    <div className="glass-card rounded-2xl p-5" style={{ height: 240 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Star size={13} className="text-ir-indigo-light" />
                        <span className="text-[11px] font-mono text-ir-slate uppercase tracking-wider">Signal Radar</span>
                      </div>
                      <ResponsiveContainer width="100%" height="85%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="rgba(255,255,255,0.05)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }} />
                          <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15}
                            dot={{ fill: '#818cf8', r: 3 }} />
                          <Tooltip
                            contentStyle={{ background: '#0a1628', border: '1px solid rgba(99,102,241,0.3)', color: '#f1f5f9', fontSize: 11, borderRadius: 8 }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(v: any) => [typeof v === 'number' ? v.toFixed(1) : String(v ?? 'N/A'), '']}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="glass-card rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain size={13} className="text-ir-indigo-light" />
                        <span className="text-[11px] font-mono text-ir-slate uppercase tracking-wider">AI Evidence</span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">{selected.reasoning}</p>
                    </div>
                  </motion.div>
                )}

                {tab === 'signals' && (
                  <motion.div key="sig" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="glass-card rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity size={13} className="text-ir-amber" />
                      <span className="text-[11px] font-mono text-ir-slate uppercase tracking-wider">Platform Signals</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Open to Work', value: selected.open_to_work ? 'Yes' : 'No', color: selected.open_to_work ? '#34d399' : '#64748b' },
                        { label: 'Notice Period', value: `${selected.notice_period_days}d`, color: selected.notice_period_days <= 30 ? '#34d399' : '#94a3b8' },
                        { label: 'Response Rate', value: `${Math.round(selected.recruiter_response_rate * 100)}%`, color: selected.recruiter_response_rate >= 0.7 ? '#34d399' : '#94a3b8' },
                        { label: 'Experience', value: `${selected.years_experience.toFixed(1)} yrs`, color: '#818cf8' },
                        { label: 'Location', value: (selected.location || selected.country || 'Unknown').split(',')[0], color: '#94a3b8' },
                        { label: 'ID', value: selected.candidate_id, color: '#475569' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="text-[11px] text-ir-slate mb-1">{label}</div>
                          <div className="text-sm font-mono font-semibold truncate" style={{ color }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {tab === 'skills' && (
                  <motion.div key="sk" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="glass-card rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Award size={13} className="text-ir-indigo-light" />
                        <span className="text-[11px] font-mono text-ir-slate uppercase tracking-wider">All Skills</span>
                      </div>
                      <span className="text-[11px] font-mono text-ir-slate">{selected.skill_names.length} total</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.skill_names.map(s => {
                        const color = getSkillColor(s)
                        return (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-lg font-mono"
                            style={{ color, background: `${color}0f`, border: `1px solid ${color}28` }}>
                            {s}
                          </span>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
