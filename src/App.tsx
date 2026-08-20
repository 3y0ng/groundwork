import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { WelcomeModal, SetupGuide } from '@/components/Onboarding'
import { useUI, WELCOME_KEY } from '@/store/ui'
import { useStore } from '@/store/useStore'
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
  const [welcome, setWelcome] = useState(() => {
    try { return !localStorage.getItem(WELCOME_KEY) } catch { return false }
  })
  const { setupOpen, openSetup, closeSetup } = useUI()
  const startFresh = useStore(s => s.startFresh)
  const resetDemo = useStore(s => s.resetDemo)
  const navigate = useNavigate()

  const dismissWelcome = () => {
    try { localStorage.setItem(WELCOME_KEY, '1') } catch { /* ignore */ }
    setWelcome(false)
  }

  const handleStartFresh = () => {
    startFresh()
    dismissWelcome()
    navigate('/settings')
  }

  const handleExploreDemo = () => {
    resetDemo()
    dismissWelcome()
    navigate('/')
  }

  const handleOpenSetup = () => {
    dismissWelcome()
    navigate('/settings')
    openSetup()
  }

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

      {welcome && <WelcomeModal onClose={handleStartFresh} onStartFresh={handleStartFresh} onOpenSetup={handleOpenSetup} onExploreDemo={handleExploreDemo} />}
      <SetupGuide open={setupOpen} onClose={closeSetup} />
    </div>
  )
}
