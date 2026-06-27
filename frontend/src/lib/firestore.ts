import { db } from './firebase'
import {
  collection, doc, setDoc, getDocs, query, orderBy, limit, serverTimestamp
} from 'firebase/firestore'
import type { Candidate, RankingResult } from '../App'

const RUNS_COL = 'ranking_runs'
const CANDIDATES_COL = 'top_candidates'

export async function saveRankingRun(result: RankingResult): Promise<string> {
  const runId = `run_${Date.now()}`
  const runRef = doc(db, RUNS_COL, runId)
  await setDoc(runRef, {
    jd: result.jd,
    weights_used: result.weights_used,
    total_candidates: result.total_candidates,
    elapsed_s: result.elapsed_s,
    result_count: result.results.length,
    top_score: result.results[0]?.final_score ?? 0,
    created_at: serverTimestamp(),
  })
  // Write each top-100 candidate as a sub-document
  const batch: Promise<void>[] = result.results.map((c, i) => {
    const cRef = doc(db, RUNS_COL, runId, CANDIDATES_COL, c.candidate_id)
    return setDoc(cRef, { ...c, rank: i + 1 })
  })
  await Promise.all(batch)
  return runId
}

export async function getRecentRuns(n = 5) {
  const q = query(collection(db, RUNS_COL), orderBy('created_at', 'desc'), limit(n))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getRunCandidates(runId: string): Promise<Candidate[]> {
  const q = query(
    collection(db, RUNS_COL, runId, CANDIDATES_COL),
    orderBy('rank', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as Candidate)
}
