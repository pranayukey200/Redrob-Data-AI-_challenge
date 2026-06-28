import { useState } from 'react'
import LandingScreen from './components/LandingScreen'
import JDInputScreen from './components/JDInputScreen'
import RankedListScreen from './components/RankedListScreen'
import { saveRankingRun } from './lib/firestore'
import './App.css'

export type WeightPreset = 'balanced' | 'senior' | 'ic' | 'custom'

export interface Weights {
  semantic: number
  skill: number
  career: number
  behavioral: number
}

export interface Candidate {
  candidate_id: string
  name: string
  headline: string
  current_title: string
  years_experience: number
  country: string
  location: string
  skill_names: string[]
  open_to_work: boolean
  notice_period_days: number
  recruiter_response_rate: number
  reasoning: string
  final_score: number
  semantic_score: number | null
  skill_match_score: number
  career_fit_score: number
  behavioral_score: number
}

export interface RankingResult {
  jd: {
    title: string
    company: string
    must_have_clusters: string[]
    experience_range: string
  }
  weights_used: Weights
  total_candidates: number
  elapsed_s: number
  results: Candidate[]
}

interface PreloadedData {
  jd: RankingResult['jd']
  total_candidates: number
  candidates: Candidate[]
}

const PRESET_WEIGHTS: Record<WeightPreset, Weights> = {
  balanced: { semantic: 0.20, skill: 0.35, career: 0.30, behavioral: 0.15 },
  senior:   { semantic: 0.15, skill: 0.30, career: 0.40, behavioral: 0.15 },
  ic:       { semantic: 0.20, skill: 0.40, career: 0.25, behavioral: 0.15 },
  custom:   { semantic: 0.20, skill: 0.35, career: 0.30, behavioral: 0.15 },
}

type Screen = 'landing' | 'rank' | 'results'

function rerankInBrowser(candidates: Candidate[], weights: Weights, topK = 100): Candidate[] {
  return candidates
    .map(c => {
      const sigs: Record<string, number> = {}
      const wts: Record<string, number> = {}
      if (c.skill_match_score != null)  { sigs.skill = c.skill_match_score;  wts.skill = weights.skill }
      if (c.career_fit_score != null)   { sigs.career = c.career_fit_score;  wts.career = weights.career }
      if (c.behavioral_score != null)   { sigs.behav = c.behavioral_score;   wts.behav = weights.behavioral }
      if (c.semantic_score != null)     { sigs.sem = c.semantic_score;       wts.sem = weights.semantic }
      const totalW = Object.values(wts).reduce((a, b) => a + b, 0)
      const finalScore = totalW > 0
        ? Object.entries(sigs).reduce((sum, [k, v]) => sum + v * (wts[k] ?? 0), 0) / totalW
        : 0
      return { ...c, final_score: Math.round(finalScore * 10000) / 10000 }
    })
    .sort((a, b) => b.final_score - a.final_score || a.candidate_id.localeCompare(b.candidate_id))
    .slice(0, topK)
}

function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [ranking, setRanking] = useState<RankingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [weights, setWeights] = useState<Weights>(PRESET_WEIGHTS.balanced)
  const [preset, setPreset] = useState<WeightPreset>('balanced')
  const [preloadedData, setPreloadedData] = useState<PreloadedData | null>(null)

  const handleRank = async () => {
    setLoading(true)
    setError(null)
    const t0 = performance.now()

    try {
      let data = preloadedData

      if (!data) {
        setLoadingStage('Loading candidate pool...')
        const res = await fetch('/candidates_data.json')
        if (!res.ok) throw new Error(`Failed to load candidate data (HTTP ${res.status})`)
        data = await res.json() as PreloadedData
        setPreloadedData(data)
      }

      setLoadingStage('Scoring 100K candidates...')
      // Small deliberate pause so the user sees the stage transition
      await new Promise(r => setTimeout(r, 350))

      setLoadingStage('Building results...')
      const reranked = rerankInBrowser(data.candidates, weights, 100)
      await new Promise(r => setTimeout(r, 150))

      const elapsed = Math.round((performance.now() - t0) / 10) / 100

      const result: RankingResult = {
        jd: data.jd,
        weights_used: weights,
        total_candidates: data.total_candidates,
        elapsed_s: elapsed,
        results: reranked,
      }

      setRanking(result)
      setScreen('results')
      saveRankingRun(result).catch(console.warn)

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setLoading(false)
      setLoadingStage('')
    }
  }

  const handlePresetChange = (p: WeightPreset) => {
    setPreset(p)
    if (p !== 'custom') setWeights(PRESET_WEIGHTS[p])
  }

  if (screen === 'results' && ranking) {
    return <RankedListScreen ranking={ranking} onBack={() => setScreen('rank')} />
  }

  if (screen === 'rank') {
    return (
      <JDInputScreen
        weights={weights} preset={preset}
        loading={loading} loadingStage={loadingStage} error={error}
        onPresetChange={handlePresetChange}
        onWeightsChange={setWeights}
        onRank={handleRank}
        onBack={() => setScreen('landing')}
      />
    )
  }

  return <LandingScreen onStart={() => setScreen('rank')} />
}

export default App
