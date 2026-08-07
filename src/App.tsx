import { Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Overview } from '@/pages/Overview'
import { Hypotheses } from '@/pages/Hypotheses'
import { HypothesisDetail } from '@/pages/HypothesisDetail'
import { Segments } from '@/pages/Segments'
import { Interviews } from '@/pages/Interviews'
import { InterviewDetail } from '@/pages/InterviewDetail'
import { Insights } from '@/pages/Insights'
import { EvidenceBoard } from '@/pages/EvidenceBoard'
import { Decisions } from '@/pages/Decisions'
import { ProjectSettings } from '@/pages/ProjectSettings'

export default function App() {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/hypotheses" element={<Hypotheses />} />
            <Route path="/hypotheses/:id" element={<HypothesisDetail />} />
            <Route path="/segments" element={<Segments />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/interviews/:id" element={<InterviewDetail />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/evidence" element={<EvidenceBoard />} />
            <Route path="/decisions" element={<Decisions />} />
            <Route path="/settings" element={<ProjectSettings />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
