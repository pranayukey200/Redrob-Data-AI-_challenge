import { motion } from 'framer-motion'
import { ArrowRight, Star, Zap, Brain, CheckCircle, Search, BarChart2, Award } from 'lucide-react'

interface Props { onStart: () => void }

const stats = [
  { value: '100K', label: 'Candidates Ranked' },
  { value: '4', label: 'AI Signals' },
  { value: '<40s', label: 'Full Ranking Time' },
  { value: '72.6', label: 'Top Score Achieved' },
]

const steps = [
  {
    icon: <Search size={22} className="text-blue-600" />,
    title: 'Deep JD Understanding',
    desc: 'The system parses the job description into 5 must-have skill clusters, experience range, location context, and explicit disqualifiers.',
  },
  {
    icon: <Brain size={22} className="text-blue-600" />,
    title: 'Multi-Signal Scoring',
    desc: 'Each candidate is scored across Skill Match, Career Fit, Behavioral availability, and Semantic similarity — then fused into a single rank score.',
  },
  {
    icon: <Award size={22} className="text-blue-600" />,
    title: 'Ranked Results',
    desc: 'Top candidates surface with transparent evidence: which skills matched, career trajectory, availability signals, and a plain-English reasoning string.',
  },
]

const signals = [
  { label: 'Skill Match', weight: '35%', color: '#0084FF', desc: 'Cluster coverage, proficiency, duration, endorsements' },
  { label: 'Career Fit', weight: '30%', color: '#319AFF', desc: 'Experience years, title relevance, location, company type' },
  { label: 'Semantic', weight: '20%', color: '#60B1FF', desc: 'TF-IDF bigram cosine similarity against JD query' },
  { label: 'Behavioral', weight: '15%', color: '#93C5FD', desc: 'Availability, responsiveness, reliability, platform engagement' },
]

const faIn = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

export default function LandingScreen({ onStart }: Props) {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute animate-float-a"
          style={{ width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,177,255,0.18) 0%, transparent 70%)', top: -200, left: -150 }} />
        <div className="absolute animate-float-b"
          style={{ width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(49,154,255,0.12) 0%, transparent 70%)', top: 100, right: -150 }} />
        <div className="absolute"
          style={{ width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,177,255,0.08) 0%, transparent 70%)', bottom: 100, left: '40%' }} />
      </div>

      {/* Navbar */}
      <div className="sticky top-7 z-50 flex justify-center px-4">
        <div className="glass-strong rounded-2xl px-6 py-3 flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(0,132,255,0.4)]">
              <Brain size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-navy text-base">IntelliRank</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#how" className="hover:text-blue-600 transition-colors">How it works</a>
            <a href="#signals" className="hover:text-blue-600 transition-colors">Signals</a>
            <a href="#results" className="hover:text-blue-600 transition-colors">Results</a>
          </nav>
          <button onClick={onStart}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl">
            Try It <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <motion.div {...faIn(0)} className="space-y-6">
          {/* Rating badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange/10 border border-orange/20">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#FF801E" className="text-orange" />)}
            </div>
            <span className="text-sm font-medium text-slate-400">Rated top submission · Redrob Data &amp; AI Challenge</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-bold text-navy leading-[1.05] tracking-[-2px]">
            Rank candidates<br />
            the way a<br />
            <span className="gradient-text-blue">great recruiter</span><br />
            would.
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed tracking-[-0.5px] max-w-md">
            Recruiters miss the right person — not because the talent isn't there, but because keyword filters can't see what actually matters.
            IntelliRank scores 100,000 candidates in under 40 seconds using 4 AI signals.
          </p>

          <div className="flex flex-wrap gap-3">
            <button onClick={onStart} className="btn-primary flex items-center gap-2 px-6 py-3.5 text-base rounded-2xl">
              <span>Find Best Candidates</span>
              <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center">
                <ArrowRight size={14} className="text-white" />
              </div>
            </button>
            <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3.5 text-base font-medium text-blue-600 rounded-2xl border border-blue-200 hover:bg-blue-50 transition-colors">
              Learn how it works
            </button>
          </div>
        </motion.div>

        {/* Right — visual orb + stats */}
        <motion.div {...faIn(0.15)} className="relative flex items-center justify-center">
          {/* Glassy orb */}
          <div className="relative w-80 h-80">
            <div className="absolute inset-0 rounded-full animate-spin-slow"
              style={{ background: 'conic-gradient(from 0deg, rgba(0,132,255,0.3), rgba(96,177,255,0.1), rgba(49,154,255,0.3), rgba(0,132,255,0.3))', filter: 'blur(1px)' }} />
            <div className="absolute inset-2 rounded-full glass-strong flex flex-col items-center justify-center gap-2">
              <Brain size={40} className="text-blue-600" style={{ filter: 'drop-shadow(0 0 12px rgba(0,132,255,0.4))' }} />
              <div className="text-center">
                <div className="text-3xl font-display font-bold gradient-text-blue">72.6</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">Top candidate score</div>
              </div>
              <div className="flex gap-2 mt-1">
                {['Skill', 'Career', 'Behav', 'Sem'].map((l, i) => (
                  <div key={l} className="text-center">
                    <div className="text-xs font-bold text-blue-600 font-mono">
                      {['87', '90', '83', '11'][i]}
                    </div>
                    <div className="text-[9px] text-slate-400">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Floating chips */}
            <div className="absolute -top-4 -right-4 glass rounded-2xl px-3 py-2 shadow-glass text-xs font-medium text-navy flex items-center gap-1.5">
              <CheckCircle size={12} className="text-blue-500" /> Staff ML Engineer
            </div>
            <div className="absolute -bottom-2 -left-6 glass rounded-2xl px-3 py-2 shadow-glass text-xs font-medium text-navy flex items-center gap-1.5">
              <Zap size={12} className="text-orange" /> Open to work · 60d notice
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-16">
        <motion.div {...faIn(0)} className="glass rounded-3xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-display font-bold gradient-text-blue">{s.value}</div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <motion.div {...faIn()} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-4">
            <span className="text-blue-600 text-xs font-semibold uppercase tracking-wider">How It Works</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-navy tracking-tight">From job description to top candidates<br />in under 40 seconds</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div key={i} {...faIn(i * 0.1)}
              className="glass rounded-3xl p-6 space-y-4 hover:shadow-glass-lg transition-shadow">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                {s.icon}
              </div>
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 font-mono">
                {i + 1}
              </div>
              <h3 className="font-display font-bold text-navy text-lg">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Signal breakdown */}
      <section id="signals" className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <motion.div {...faIn()} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-4">
            <span className="text-blue-600 text-xs font-semibold uppercase tracking-wider">AI Signals</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-navy tracking-tight">Four signals, one great hire</h2>
          <p className="text-slate-400 mt-3 text-base">Missing signals are renormalized out — never penalised</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {signals.map((s, i) => (
            <motion.div key={i} {...faIn(i * 0.08)} className="glass rounded-2xl p-5 flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-white text-sm"
                style={{ background: s.color, boxShadow: `0 4px 16px ${s.color}50` }}>
                {s.weight}
              </div>
              <div>
                <div className="font-bold text-navy font-display">{s.label}</div>
                <div className="text-sm text-slate-400 mt-1">{s.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Top results preview */}
      <section id="results" className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <motion.div {...faIn()} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-4">
            <span className="text-blue-600 text-xs font-semibold uppercase tracking-wider">Live Results</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-navy tracking-tight">Top candidates for Senior AI Engineer</h2>
        </motion.div>
        <div className="space-y-3">
          {[
            { rank: 1, title: 'Staff Machine Learning Engineer', score: 72.6, skills: ['Semantic Search', 'pgvector', 'Pinecone', 'BM25'], open: true, exp: 7.0 },
            { rank: 2, title: 'Lead AI Engineer', score: 71.2, skills: ['Information Retrieval', 'LlamaIndex', 'pgvector', 'Elasticsearch'], open: true, exp: 6.7 },
            { rank: 3, title: 'Senior ML Engineer', score: 71.0, skills: ['Weaviate', 'Pinecone', 'Milvus', 'Information Retrieval'], open: true, exp: 7.2 },
            { rank: 4, title: 'Recommendation Systems Engineer', score: 68.0, skills: ['Faiss', 'Embeddings', 'Learning to Rank', 'NLP'], open: true, exp: 6.7 },
            { rank: 5, title: 'Senior NLP Engineer', score: 64.7, skills: ['BERT', 'Dense Retrieval', 'RAG', 'Elasticsearch'], open: false, exp: 8.0 },
          ].map((c, i) => (
            <motion.div key={i} {...faIn(i * 0.06)} className="glass rounded-2xl px-5 py-4 flex items-center gap-4">
              <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono"
                style={{
                  background: i === 0 ? 'rgba(255,128,30,0.12)' : 'rgba(0,132,255,0.08)',
                  border: `1px solid ${i === 0 ? 'rgba(255,128,30,0.3)' : 'rgba(0,132,255,0.2)'}`,
                  color: i === 0 ? '#FF801E' : '#0084FF',
                }}>#{c.rank}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-navy text-sm">{c.title}</span>
                  {c.open && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-600 font-medium">Available</span>}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {c.skills.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-mono">{s}</span>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-lg font-bold font-mono" style={{ color: c.score >= 70 ? '#0084FF' : '#319AFF' }}>{c.score}</div>
                <div className="text-[10px] text-slate-400">{c.exp}y exp</div>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div {...faIn(0.3)} className="mt-8 text-center">
          <button onClick={onStart} className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base rounded-2xl">
            <BarChart2 size={18} />
            Run Full Ranking
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </section>

      {/* Trusted by */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16 border-t border-blue-50">
        <motion.div {...faIn()}>
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-8">Powered by</p>
          <div className="flex flex-wrap justify-center items-center gap-10 opacity-40 grayscale">
            {['FastAPI', 'React', 'TailwindCSS', 'Firebase', 'scikit-learn', 'framer-motion'].map(name => (
              <span key={name} className="text-sm font-semibold text-slate-600 font-mono">{name}</span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-blue-50 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain size={14} className="text-blue-600" />
          <span className="font-display font-bold text-navy text-sm">IntelliRank</span>
        </div>
        <p className="text-xs text-slate-400">Redrob Data &amp; AI Challenge · July 2026</p>
      </footer>
    </div>
  )
}
