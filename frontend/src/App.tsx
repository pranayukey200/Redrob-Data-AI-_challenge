import { useState } from 'react'
import JDInputScreen from './components/JDInputScreen'
import RankedListScreen from './components/RankedListScreen'
import './App.css'

export type WeightPreset = 'balanced' | 'senior' | 'ic' | 'custom'

export interface Weights {
  semantic: number
  skill: number
  career: number
  behavioral: number
}

export interface ScoreBreakdown {
  semantic_score: number | null
  skill_match_score: number
  career_fit_score: number
  behavioral_score: number
  final_score: number
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

const PRESET_WEIGHTS: Record<WeightPreset, Weights> = {
  balanced: { semantic: 0.20, skill: 0.35, career: 0.30, behavioral: 0.15 },
  senior: { semantic: 0.15, skill: 0.30, career: 0.40, behavioral: 0.15 },
  ic: { semantic: 0.20, skill: 0.40, career: 0.25, behavioral: 0.15 },
  custom: { semantic: 0.20, skill: 0.35, career: 0.30, behavioral: 0.15 },
}

function App() {
  const [screen, setScreen] = useState<'jd' | 'results'>('jd')
  const [ranking, setRanking] = useState<RankingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [weights, setWeights] = useState<Weights>(PRESET_WEIGHTS.balanced)
  const [preset, setPreset] = useState<WeightPreset>('balanced')

  const handleRank = async () => {
    setLoading(true)
    setError(null)
    try {
      setLoadingStage('Loading candidate pool...')
      await fetch('http://localhost:8000/api/candidates/load', { method: 'POST' })

      setLoadingStage('Scoring candidate pool...')
      const res = await fetch('http://localhost:8000/api/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights, top_k: 100 }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Ranking failed')
      }
      setLoadingStage('Ranking...')
      const data = await res.json()
      setRanking(data)
      setScreen('results')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg.includes('Failed to fetch')
        ? 'Cannot connect to backend. Start it with: uvicorn api.main:app --port 8000'
        : msg)
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
    return (
      <RankedListScreen
        ranking={ranking}
        onBack={() => setScreen('jd')}
      />
    )
  }

  return (
    <JDInputScreen
      weights={weights}
      preset={preset}
      loading={loading}
      loadingStage={loadingStage}
      error={error}
      onPresetChange={handlePresetChange}
      onWeightsChange={setWeights}
      onRank={handleRank}
    />
  )
}

export default App
