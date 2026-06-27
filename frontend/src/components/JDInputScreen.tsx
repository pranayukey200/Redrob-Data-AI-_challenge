import type { WeightPreset, Weights } from '../App'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Zap, Users, Target, ChevronRight, Sliders, Sparkles } from 'lucide-react'

const JD_TEXT = `Senior AI Engineer — Founding Team
Redrob AI · Pune / Noida, India (Hybrid)
Experience: 5–9 years

MUST HAVE
  • Production embeddings-based retrieval (sentence-transformers, BGE, E5)
  • Vector databases: FAISS, Pinecone, Weaviate, Qdrant, Milvus, Elasticsearch
  • Strong Python (production-grade ML systems)
  • Ranking evaluation: NDCG, MRR, MAP, A/B testing frameworks
  • NLP / Information Retrieval background

NICE TO HAVE
  LLM fine-tuning (LoRA / QLoRA) · Learning-to-rank · RAG systems · Distributed inference`

interface Props {
  weights: Weights
  preset: WeightPreset
  loading: boolean
  loadingStage: string
  error: string | null
  onPresetChange: (p: WeightPreset) => void
  onWeightsChange: (w: Weights) => void
  onRank: () => void
}

const PRESETS: { id: WeightPreset; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'balanced', label: 'Balanced', desc: 'Equal weight across all signals', icon: <Target size={14} /> },
  { id: 'senior', label: 'Senior Hire', desc: 'Prioritize career trajectory', icon: <Users size={14} /> },
  { id: 'ic', label: 'Deep IC', desc: 'Max skill & activity signals', icon: <Zap size={14} /> },
  { id: 'custom', label: 'Custom', desc: 'Tune every weight', icon: <Sliders size={14} /> },
]

const SIGNAL_COLORS: Record<keyof Weights, string> = {
  skill: '#6366f1',
  career: '#22d3ee',
  behavioral: '#fbbf24',
  semantic: '#34d399',
}

const SIGNAL_LABELS: Record<keyof Weights, string> = {
  skill: 'Skill Match',
  career: 'Career Fit',
  behavioral: 'Behavioral',
  semantic: 'Semantic',
}

export default function JDInputScreen({
  weights, preset, loading, loadingStage, error,
  onPresetChange, onWeightsChange, onRank,
}: Props) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  const normalizedPct = (v: number) => Math.round((v / total) * 100)

  const handleSlider = (key: keyof Weights, val: number) => {
    onWeightsChange({ ...weights, [key]: val / 100 })
    onPresetChange('custom')
  }

  return (
    <div className="relative min-h-screen bg-base overflow-hidden flex flex-col">

      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[700px] h-[700px] rounded-full animate-float-a"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', top: '-200px', left: '-150px' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full animate-float-b"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)', bottom: '-100px', right: '-100px' }} />
        <div className="absolute w-[350px] h-[350px] rounded-full animate-float-c"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', top: '40%', left: '55%' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Nav bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ir-indigo flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.5)]">
            <Brain size={16} className="text-white" />
          </div>
          <span className="text-white font-bold tracking-tight text-lg">IntelliRank</span>
          <span className="ml-1 text-xs font-mono text-ir-indigo-light bg-ir-indigo/10 border border-ir-indigo/20 rounded px-2 py-0.5">v1.0</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-ir-slate font-mono">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-ir-emerald animate-pulse-slow" />100K candidates</span>
          <span>4 signals</span>
          <span>~37s ranking</span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[680px] space-y-5"
        >
          {/* Hero */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-ir-indigo/30 bg-ir-indigo/8 mb-2">
              <Sparkles size={12} className="text-ir-indigo-light" />
              <span className="text-ir-indigo-light text-xs font-mono tracking-widest uppercase">Redrob · Data & AI Challenge</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight">
              Rank Candidates the Way<br />
              <span className="gradient-text">a Great Recruiter Would</span>
            </h1>
            <p className="text-ir-slate text-sm max-w-md mx-auto leading-relaxed">
              Not by matching keywords — but by actually understanding who fits the role.
              Multi-signal AI scoring across skill depth, career trajectory, behavioral signals, and semantic relevance.
            </p>
          </div>

          {/* JD Card */}
          <div className="glass-card rounded-2xl p-5 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-ir-indigo/20 flex items-center justify-center">
                  <Target size={12} className="text-ir-indigo-light" />
                </div>
                <span className="text-ir-indigo-light text-xs font-mono uppercase tracking-wider font-semibold">Job Description</span>
              </div>
              <span className="text-xs text-ir-slate font-mono bg-surface-2 border border-white/5 rounded px-2 py-0.5">pre-loaded</span>
            </div>
            <pre className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-mono max-h-44 overflow-y-auto">
              {JD_TEXT}
            </pre>
          </div>

          {/* Signal weights */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-ir-slate text-xs font-mono uppercase tracking-wider">Signal Weights</span>
              <div className="flex gap-1.5">
                {PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onPresetChange(p.id)}
                    title={p.desc}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      preset === p.id
                        ? 'bg-ir-indigo text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                        : 'text-ir-slate border border-white/8 hover:border-ir-indigo/40 hover:text-ir-indigo-light'
                    }`}
                  >
                    {p.icon}
                    <span className="hidden sm:inline">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Signal bars (always visible) */}
            <div className="space-y-2.5">
              {(Object.keys(weights) as (keyof Weights)[]).map(key => {
                const pct = normalizedPct(weights[key])
                const color = SIGNAL_COLORS[key]
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">{SIGNAL_LABELS[key]}</span>
                      <span className="font-mono font-semibold" style={{ color }}>{pct}%</span>
                    </div>
                    {preset === 'custom' ? (
                      <input
                        type="range" min={0} max={100}
                        value={Math.round(weights[key] * 100)}
                        onChange={e => handleSlider(key, Number(e.target.value))}
                        style={{ '--accent': color } as React.CSSProperties}
                        className="w-full"
                      />
                    ) : (
                      <div className="h-1.5 rounded-full bg-white/5">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          style={{ background: color, boxShadow: `0 0 8px ${color}50` }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-red-400 text-sm font-mono backdrop-blur"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <motion.button
            onClick={onRank}
            disabled={loading}
            whileHover={!loading ? { scale: 1.01 } : {}}
            whileTap={!loading ? { scale: 0.99 } : {}}
            className="relative w-full py-4 rounded-xl font-semibold text-base text-white overflow-hidden disabled:cursor-not-allowed disabled:opacity-70 btn-glow"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span className="font-mono text-sm tracking-wide">{loadingStage || 'Processing...'}</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Brain size={18} />
                Find Best-Fit Candidates
                <ChevronRight size={16} className="opacity-70" />
              </span>
            )}
          </motion.button>

          {/* Footer stats */}
          <div className="flex items-center justify-center gap-6 pt-1">
            {[
              { label: '100K', sub: 'candidates' },
              { label: '4', sub: 'AI signals' },
              { label: '<40s', sub: 'ranking time' },
              { label: 'offline', sub: 'no LLM calls' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-sm font-bold gradient-text-indigo font-mono">{s.label}</div>
                <div className="text-xs text-ir-slate">{s.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
