import type { WeightPreset, Weights } from '../App'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Target, Users, Zap, Sliders, ArrowRight, ChevronLeft } from 'lucide-react'

const JD_TEXT = `Senior AI Engineer — Founding Team
Redrob AI · Pune / Noida, India (Hybrid) · 5–9 years

MUST HAVE
  • Production embeddings-based retrieval (sentence-transformers, BGE, E5)
  • Vector databases (FAISS, Pinecone, Weaviate, Qdrant, Milvus, Elasticsearch)
  • Strong Python (production-grade ML systems)
  • Ranking evaluation: NDCG, MRR, MAP, A/B testing frameworks
  • NLP / Information Retrieval background

NICE TO HAVE
  LLM fine-tuning (LoRA / QLoRA) · Learning-to-rank · RAG systems`

interface Props {
  weights: Weights
  preset: WeightPreset
  loading: boolean
  loadingStage: string
  error: string | null
  onPresetChange: (p: WeightPreset) => void
  onWeightsChange: (w: Weights) => void
  onRank: () => void
  onBack: () => void
}

const PRESETS: { id: WeightPreset; label: string; icon: React.ReactNode }[] = [
  { id: 'balanced', label: 'Balanced', icon: <Target size={13} /> },
  { id: 'senior', label: 'Senior Hire', icon: <Users size={13} /> },
  { id: 'ic', label: 'Deep IC', icon: <Zap size={13} /> },
  { id: 'custom', label: 'Custom', icon: <Sliders size={13} /> },
]

const SIGNAL_META: { key: keyof Weights; label: string; color: string }[] = [
  { key: 'skill', label: 'Skill Match', color: '#0084FF' },
  { key: 'career', label: 'Career Fit', color: '#319AFF' },
  { key: 'semantic', label: 'Semantic', color: '#60B1FF' },
  { key: 'behavioral', label: 'Behavioral', color: '#93C5FD' },
]

export default function JDInputScreen({
  weights, preset, loading, loadingStage, error,
  onPresetChange, onWeightsChange, onRank, onBack,
}: Props) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  const pct = (v: number) => Math.round((v / total) * 100)

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute animate-float-a"
          style={{ width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,177,255,0.15) 0%, transparent 70%)', top: -150, left: -100 }} />
        <div className="absolute animate-float-b"
          style={{ width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(49,154,255,0.1) 0%, transparent 70%)', bottom: 0, right: 0 }} />
      </div>

      {/* Top nav */}
      <div className="relative z-10 flex items-center gap-3 px-6 py-4 border-b border-blue-50">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 text-sm transition-colors group">
          <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>
        <div className="flex items-center gap-2 ml-1">
          <Brain size={16} className="text-blue-600" />
          <span className="font-display font-bold text-navy text-sm">IntelliRank</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[620px] space-y-5"
        >
          <div className="text-center space-y-2 mb-8">
            <h1 className="font-display text-3xl font-bold text-navy tracking-tight">Configure &amp; Rank</h1>
            <p className="text-slate-400 text-sm">Tune signal weights then run AI ranking across 100,000 candidates</p>
          </div>

          {/* JD card */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Target size={12} className="text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Job Description</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono bg-blue-50 rounded px-2 py-0.5">pre-loaded</span>
            </div>
            <pre className="text-slate-500 text-xs leading-relaxed whitespace-pre-wrap font-mono max-h-44 overflow-y-auto">{JD_TEXT}</pre>
          </div>

          {/* Weights */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signal Weights</span>
              <div className="flex gap-1.5">
                {PRESETS.map(p => (
                  <button key={p.id} onClick={() => onPresetChange(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      preset === p.id
                        ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(0,132,255,0.3)]'
                        : 'text-slate-400 border border-blue-100 hover:border-blue-300 hover:text-blue-600'
                    }`}>
                    {p.icon}{p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {SIGNAL_META.map(({ key, label, color }) => {
                const val = pct(weights[key])
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">{label}</span>
                      <span className="font-mono font-bold" style={{ color }}>{val}%</span>
                    </div>
                    {preset === 'custom' ? (
                      <input type="range" min={0} max={100}
                        value={Math.round(weights[key] * 100)}
                        onChange={e => onWeightsChange({ ...weights, [key]: Number(e.target.value) / 100 })}
                        style={{ '--accent': color } as React.CSSProperties}
                        className="w-full"
                      />
                    ) : (
                      <div className="h-2 rounded-full bg-blue-50 overflow-hidden">
                        <motion.div className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${val}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 text-sm">
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
            className="btn-primary w-full py-4 text-base rounded-2xl flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span className="font-mono text-sm">{loadingStage || 'Processing...'}</span>
              </>
            ) : (
              <>
                <Brain size={18} />
                Find Best-Fit Candidates
                <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center">
                  <ArrowRight size={13} />
                </div>
              </>
            )}
          </motion.button>

          <p className="text-center text-xs text-slate-400">
            100,000 candidates · TF-IDF semantic + skill + career + behavioral · ~37s
          </p>
        </motion.div>
      </div>
    </div>
  )
}
