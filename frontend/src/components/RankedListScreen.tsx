import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie,
} from 'recharts'
import { Brain, MapPin, Clock, ChevronLeft, Download, TrendingUp, Award, Activity, Cpu, CheckCircle, BarChart2, Users } from 'lucide-react'
import type { Candidate, RankingResult } from '../App'

interface Props {
  ranking: RankingResult
  onBack: () => void
}

const SKILL_CLUSTERS: Record<string, string> = {
  embeddings: '#0084FF', retrieval: '#0084FF',
  vector: '#319AFF', faiss: '#319AFF', pinecone: '#319AFF', weaviate: '#319AFF', milvus: '#319AFF',
  python: '#60B1FF', pytorch: '#60B1FF', tensorflow: '#60B1FF',
  nlp: '#93C5FD', information: '#93C5FD', ranking: '#93C5FD',
  llm: '#BFDBFE', rag: '#BFDBFE',
}
function skillColor(s: string): string {
  const l = s.toLowerCase()
  return Object.entries(SKILL_CLUSTERS).find(([k]) => l.includes(k))?.[1] ?? '#94a3b8'
}

function ScoreRing({ score, size = 84 }: { score: number; size?: number }) {
  const r = size / 2 - 8
  const c = 2 * Math.PI * r
  const fill = Math.min(score / 100, 1) * c
  const color = score >= 65 ? '#0084FF' : score >= 45 ? '#319AFF' : '#93C5FD'
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EBF5FF" strokeWidth="6" />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${fill} ${c - fill}` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-bold leading-none" style={{ color, fontSize: size * 0.22 }}>{score.toFixed(0)}</span>
        <span className="text-slate-400 leading-none mt-0.5" style={{ fontSize: size * 0.12 }}>score</span>
      </div>
    </div>
  )
}

function ScoreBar({ label, value, color, icon }: { label: string; value: number | null; color: string; icon: React.ReactNode }) {
  if (value === null) return (
    <div className="flex items-center gap-3 py-2">
      <div className="text-slate-300">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">{label}</span>
          <span className="text-slate-300 italic font-mono">N/A</span>
        </div>
        <div className="h-1.5 rounded-full bg-blue-50" />
      </div>
    </div>
  )
  return (
    <div className="flex items-center gap-3 py-2">
      <div style={{ color }}>{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-navy font-medium">{label}</span>
          <span className="font-mono font-bold" style={{ color }}>{value.toFixed(1)}</span>
        </div>
        <div className="h-2 rounded-full bg-blue-50 overflow-hidden">
          <motion.div className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, value)}%` }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
            style={{ background: color, boxShadow: `0 0 8px ${color}50` }}
          />
        </div>
      </div>
    </div>
  )
}

/* Insights charts derived from the ranking result */
function InsightsPanel({ results }: { results: Candidate[] }) {
  const buckets = ['50-55', '55-60', '60-65', '65-70', '70-75']
  const histData = buckets.map((b, i) => {
    const lo = 50 + i * 5, hi = lo + 5
    return { name: b, count: results.filter(c => c.final_score >= lo && c.final_score < hi).length }
  })

  const expBuckets = [
    { name: '<4y', count: results.filter(c => c.years_experience < 4).length },
    { name: '4-6y', count: results.filter(c => c.years_experience >= 4 && c.years_experience < 6).length },
    { name: '6-8y', count: results.filter(c => c.years_experience >= 6 && c.years_experience < 8).length },
    { name: '8-10y', count: results.filter(c => c.years_experience >= 8 && c.years_experience < 10).length },
    { name: '10y+', count: results.filter(c => c.years_experience >= 10).length },
  ]

  const openPie = [
    { name: 'Open to work', value: results.filter(c => c.open_to_work).length },
    { name: 'Not available', value: results.filter(c => !c.open_to_work).length },
  ]

  const skillFreq: Record<string, number> = {}
  results.forEach(c => c.skill_names.forEach(s => { skillFreq[s] = (skillFreq[s] || 0) + 1 }))
  const topSkills = Object.entries(skillFreq)
    .sort(([,a],[,b]) => b - a).slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  return (
    <div className="space-y-5">
      {/* Score distribution */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={14} className="text-blue-600" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Score Distribution (Top 100)</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={histData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EBF5FF" />
            <XAxis dataKey="name" tick={{ fill: '#4A6080', fontSize: 11 }} />
            <YAxis tick={{ fill: '#4A6080', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #D6ECFF', borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {histData.map((_, i) => <Cell key={i} fill={['#EBF5FF','#D6ECFF','#ADDBFF','#60B1FF','#0084FF'][i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Experience + Availability side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} className="text-blue-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Experience</span>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={expBuckets} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#4A6080', fontSize: 10 }} />
              <YAxis tick={{ fill: '#4A6080', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #D6ECFF', borderRadius: 10, fontSize: 11 }} />
              <Bar dataKey="count" fill="#319AFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={13} className="text-blue-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Availability</span>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={openPie} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={3}>
                <Cell fill="#0084FF" />
                <Cell fill="#EBF5FF" />
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #D6ECFF', borderRadius: 10, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-3 justify-center text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />Open: {openPie[0].value}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-100 border border-blue-200 inline-block" />Not: {openPie[1].value}</span>
          </div>
        </div>
      </div>

      {/* Top skills */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award size={13} className="text-blue-600" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Skills in Results</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {topSkills.map(({ name, count }) => {
            const col = skillColor(name)
            return (
              <div key={name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
                style={{ borderColor: `${col}40`, background: `${col}10`, color: col }}>
                {name}
                <span className="font-mono text-[10px] opacity-70">×{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function RankedListScreen({ ranking, onBack }: Props) {
  const [selected, setSelected] = useState<Candidate | null>(ranking.results[0] || null)
  const [tab, setTab] = useState<'breakdown' | 'signals' | 'skills'>('breakdown')
  const [view, setView] = useState<'list' | 'insights'>('list')

  const downloadCSV = () => {
    const rows = [['candidate_id', 'rank', 'score', 'reasoning']]
    ranking.results.slice(0, 100).forEach((c, i) => {
      rows.push([c.candidate_id, String(i + 1), c.final_score.toFixed(4), `"${c.reasoning.replace(/"/g, '""')}"`])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'ranked_candidates.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const radarData = selected ? [
    { subject: 'Skill', value: selected.skill_match_score },
    { subject: 'Career', value: selected.career_fit_score },
    { subject: 'Behavioral', value: selected.behavioral_score },
    { subject: 'Semantic', value: selected.semantic_score ?? 0 },
  ] : []

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(96,177,255,0.1) 0%, transparent 70%)', top: -80, left: -80 }} />
        <div className="absolute w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(49,154,255,0.08) 0%, transparent 70%)', bottom: 0, right: 0 }} />
      </div>

      {/* Header */}
      <div className="relative z-20 glass-strong border-b border-blue-50 px-5 py-3 flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 text-sm transition-colors group">
          <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          New Search
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-blue-100">
          <Brain size={14} className="text-blue-600" />
          <span className="font-display font-bold text-navy text-sm">IntelliRank</span>
        </div>
        <div className="flex-1 flex flex-wrap gap-1.5">
          {ranking.jd.must_have_clusters.map(c => (
            <span key={c} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600">
              {c.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
        <span className="text-slate-400 text-xs font-mono">{ranking.total_candidates.toLocaleString()} · {ranking.elapsed_s}s</span>
        {/* View toggle */}
        <div className="flex gap-1 p-1 rounded-xl bg-blue-50">
          {(['list', 'insights'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all capitalize ${
                view === v ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-blue-600'
              }`}>{v}</button>
          ))}
        </div>
        <button onClick={downloadCSV}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">
          <Download size={11} />CSV
        </button>
      </div>

      {view === 'insights' ? (
        <div className="relative z-10 flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
          <InsightsPanel results={ranking.results} />
        </div>
      ) : (
        <div className="relative z-10 flex flex-1 overflow-hidden">
          {/* List */}
          <div className="w-[380px] flex-shrink-0 overflow-y-auto border-r border-blue-50">
            <div className="sticky top-0 z-10 px-4 py-2.5 border-b border-blue-50 bg-white/90 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Top Candidates</span>
                <span className="text-[11px] font-mono text-blue-600 font-semibold">{ranking.results.length}</span>
              </div>
            </div>

            {ranking.results.map((c, i) => (
              <motion.button key={c.candidate_id}
                onClick={() => { setSelected(c); setTab('breakdown') }}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.01, duration: 0.2 }}
                className="w-full text-left px-4 py-3.5 border-b border-blue-50 transition-all hover:bg-blue-50/50"
                style={{
                  borderLeft: selected?.candidate_id === c.candidate_id ? '3px solid #0084FF' : '3px solid transparent',
                  background: selected?.candidate_id === c.candidate_id ? 'rgba(0,132,255,0.04)' : undefined,
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Rank badge */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold font-mono"
                    style={{
                      background: i === 0 ? 'rgba(255,128,30,0.1)' : i < 3 ? '#EBF5FF' : '#F8FAFF',
                      border: `1px solid ${i === 0 ? 'rgba(255,128,30,0.3)' : i < 3 ? '#D6ECFF' : '#EBF5FF'}`,
                      color: i === 0 ? '#FF801E' : i < 3 ? '#0084FF' : '#319AFF',
                    }}>#{i+1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-navy text-sm font-semibold truncate">{c.current_title}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1.5 font-mono">
                          <Clock size={9} />{c.years_experience.toFixed(1)}y
                          <span className="opacity-30">·</span>
                          <MapPin size={9} />{(c.location || c.country || '').split(',')[0]}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold flex-shrink-0" style={{ color: c.final_score >= 65 ? '#0084FF' : '#319AFF' }}>
                        {c.final_score.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.skill_names.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-blue-50 border border-blue-100 text-blue-600">{s}</span>
                      ))}
                      {c.open_to_work && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-green-50 border border-green-100 text-green-600 flex items-center gap-0.5">
                          <CheckCircle size={8} />open
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Detail */}
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div key={selected.candidate_id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto p-5 space-y-4"
              >
                {/* Header */}
                <div className="glass rounded-2xl p-5 flex items-start gap-4">
                  <ScoreRing score={selected.final_score} size={84} />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-display font-bold text-navy leading-tight">{selected.current_title}</h2>
                    <p className="text-slate-400 text-xs mt-1 font-mono">{selected.candidate_id}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={11} />{selected.years_experience.toFixed(1)} yrs</span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{selected.location || selected.country}</span>
                      {selected.open_to_work && <span className="flex items-center gap-1 text-green-500 font-semibold"><CheckCircle size={11} />Available now</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {[
                        { l: 'Skill', v: selected.skill_match_score, c: '#0084FF' },
                        { l: 'Career', v: selected.career_fit_score, c: '#319AFF' },
                        { l: 'Behavioral', v: selected.behavioral_score, c: '#60B1FF' },
                        { l: 'Semantic', v: selected.semantic_score, c: '#93C5FD' },
                      ].map(s => (
                        <div key={s.l} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-100">
                          <span className="text-slate-400">{s.l}</span>
                          <span className="font-mono font-bold" style={{ color: s.c }}>{s.v != null ? s.v.toFixed(0) : 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-2xl bg-blue-50">
                  {(['breakdown', 'signals', 'skills'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all capitalize ${
                        tab === t ? 'bg-white text-blue-600 shadow-card' : 'text-slate-400 hover:text-blue-500'
                      }`}>{t}</button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {tab === 'breakdown' && (
                    <motion.div key="bd" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="glass rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp size={13} className="text-blue-600" />
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Score Breakdown</span>
                        </div>
                        <ScoreBar label="Skill Match" value={selected.skill_match_score} color="#0084FF" icon={<Award size={13} />} />
                        <ScoreBar label="Career Fit" value={selected.career_fit_score} color="#319AFF" icon={<TrendingUp size={13} />} />
                        <ScoreBar label="Behavioral" value={selected.behavioral_score} color="#60B1FF" icon={<Activity size={13} />} />
                        <ScoreBar label="Semantic" value={selected.semantic_score} color="#93C5FD" icon={<Cpu size={13} />} />
                      </div>

                      <div className="glass rounded-2xl p-5" style={{ height: 230 }}>
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart2 size={13} className="text-blue-600" />
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signal Radar</span>
                        </div>
                        <ResponsiveContainer width="100%" height="85%">
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="#EBF5FF" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#4A6080', fontSize: 11 }} />
                            <Radar dataKey="value" stroke="#0084FF" fill="#0084FF" fillOpacity={0.12} dot={{ fill: '#0084FF', r: 3 }} />
                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #D6ECFF', borderRadius: 10, fontSize: 11 }}
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              formatter={(v: any) => [typeof v === 'number' ? v.toFixed(1) : String(v ?? 'N/A'), '']} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="glass rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain size={13} className="text-blue-600" />
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Evidence</span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{selected.reasoning}</p>
                      </div>
                    </motion.div>
                  )}

                  {tab === 'signals' && (
                    <motion.div key="sig" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="glass rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity size={13} className="text-blue-500" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Signals</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Open to Work', value: selected.open_to_work ? 'Yes' : 'No', color: selected.open_to_work ? '#10b981' : '#94a3b8' },
                          { label: 'Notice Period', value: `${selected.notice_period_days} days`, color: selected.notice_period_days <= 30 ? '#10b981' : '#4A6080' },
                          { label: 'Response Rate', value: `${Math.round(selected.recruiter_response_rate * 100)}%`, color: selected.recruiter_response_rate >= 0.7 ? '#0084FF' : '#4A6080' },
                          { label: 'Experience', value: `${selected.years_experience.toFixed(1)} years`, color: '#0084FF' },
                          { label: 'Location', value: (selected.location || selected.country || 'Unknown').split(',')[0], color: '#4A6080' },
                          { label: 'Candidate ID', value: selected.candidate_id, color: '#93C5FD' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="rounded-2xl p-3 bg-blue-50/50 border border-blue-100">
                            <div className="text-[11px] text-slate-400 mb-1">{label}</div>
                            <div className="text-sm font-mono font-semibold truncate" style={{ color }}>{value}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {tab === 'skills' && (
                    <motion.div key="sk" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="glass rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Award size={13} className="text-blue-600" />
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">All Skills</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{selected.skill_names.length} total</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.skill_names.map(s => {
                          const col = skillColor(s)
                          return (
                            <span key={s} className="text-xs px-2.5 py-1 rounded-full font-mono border"
                              style={{ color: col, background: `${col}0f`, borderColor: `${col}30` }}>
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
      )}
    </div>
  )
}
