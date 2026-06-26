import { useEffect, useState } from "react"
import AudioUploader from "@/components/AudioUploader"
import PipelineStatus from "@/components/PipelineStatus"
import PostPreview from "@/components/PostPreview"
import DesignGuide from "@/components/DesignGuide"
import {
  uploadAudioStream,
  getSessions,
  getSession,
  type SessionResult,
  type StreamEvent,
  type SessionSummary,
} from "@/lib/api"

type StageName = "Transcripción" | "Extractor" | "Redactor" | "Diseñador"
type StageStatus = "pending" | "processing" | "done" | "error"

const STAGE_LABELS: Record<string, StageName> = {
  transcription: "Transcripción",
  extractor: "Extractor",
  redactor: "Redactor",
  disenador: "Diseñador",
}

const STAGE_ORDER: string[] = ["transcription", "extractor", "redactor", "disenador"]

function timeAgo(ts: string): string {
  const date = new Date(ts)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return "ahora"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [stages, setStages] = useState<
    { label: StageName; status: StageStatus }[]
  >(STAGE_ORDER.map((key) => ({ label: STAGE_LABELS[key], status: "pending" })))
  const [result, setResult] = useState<SessionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // History state
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [selectedSession, setSelectedSession] = useState<SessionResult | null>(null)
  const [loadingSession, setLoadingSession] = useState(false)

  // Load sessions on mount
  useEffect(() => {
    getSessions(50)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [])

  const handleFile = async (file: File) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setSelectedSession(null)
    setStages(STAGE_ORDER.map((key) => ({ label: STAGE_LABELS[key], status: "pending" })))

    try {
      const onEvent = (event: StreamEvent) => {
        const stageKey = event.stage
        if (stageKey === "session" || stageKey === "complete" || stageKey === "error") return

        setStages((prev) => {
          const idx = STAGE_ORDER.indexOf(stageKey)
          if (idx === -1) return prev
          const updated = [...prev]
          const status = event.status === "processing" ? "processing" : event.status === "done" ? "done" : "error"
          updated[idx] = { ...updated[idx], status }
          return updated
        })
      }

      const data = await uploadAudioStream(file, onEvent)
      setStages(STAGE_ORDER.map((key) => ({ label: STAGE_LABELS[key], status: "done" })))
      setResult(data)

      // Refresh history
      getSessions(50).then(setSessions).catch(() => {})
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido"
      setError(msg)
      setStages((prev) =>
        prev.map((s) => ({
          ...s,
          status: s.status === "processing" ? "error" : s.status,
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSessionClick = async (session: SessionSummary) => {
    setLoadingSession(true)
    setSelectedSession(null)
    try {
      const detail = await getSession(session.session_id)
      setSelectedSession(detail)
    } catch {
      // ignore
    } finally {
      setLoadingSession(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-white">
          LinkedIn Content Factory
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Audio → Post de alta impacto en segundos
        </p>
      </header>

      <AudioUploader onFileSelected={handleFile} disabled={loading} />

      {loading && (
        <div className="bg-dark-2 rounded-xl p-6 border border-dark-3">
          <PipelineStatus stages={stages} />
        </div>
      )}

      {error && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <>
          <PostPreview post={result.linkedin_post} />
          <DesignGuide guide={result.design_guide} />

          <details className="bg-dark-2 rounded-xl border border-dark-3">
            <summary className="px-6 py-4 text-sm text-gray-400 cursor-pointer hover:text-gray-200 font-mono">
              Ver estructura raw (raw_structure)
            </summary>
            <div className="px-6 pb-4">
              <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
                {result.raw_structure}
              </pre>
            </div>
          </details>

          {result.session_id && (
            <p className="text-center text-xs text-gray-600 font-mono">
              Sesión: {result.session_id}
            </p>
          )}
        </>
      )}

      {/* Session detail (when clicking from history) */}
      {selectedSession && !loading && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Sesión seleccionada</h2>
            <button
              onClick={() => setSelectedSession(null)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cerrar
            </button>
          </div>
          <PostPreview post={selectedSession.linkedin_post} />
          <DesignGuide guide={selectedSession.design_guide} />

          <details className="bg-dark-2 rounded-xl border border-dark-3">
            <summary className="px-6 py-4 text-sm text-gray-400 cursor-pointer hover:text-gray-200 font-mono">
              Ver estructura raw (raw_structure)
            </summary>
            <div className="px-6 pb-4">
              <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
                {selectedSession.raw_structure}
              </pre>
            </div>
          </details>

          <p className="text-center text-xs text-gray-600 font-mono">
            Sesión: {selectedSession.session_id}
          </p>
        </>
      )}

      {/* History section */}
      <div className="border-t border-dark-3 pt-8">
        <h2 className="text-lg font-bold text-white mb-4">Historial</h2>

        {loadingHistory && (
          <p className="text-gray-500 text-sm font-mono">Cargando historial...</p>
        )}

        {!loadingHistory && sessions.length === 0 && (
          <p className="text-gray-500 text-sm">Sin sesiones aún. Sube o graba tu primer audio.</p>
        )}

        {loadingSession && (
          <p className="text-gray-500 text-sm font-mono">Cargando sesión...</p>
        )}

        <div className="space-y-2">
          {sessions.map((s) => (
            <button
              key={s.session_id}
              onClick={() => handleSessionClick(s)}
              disabled={loadingSession}
              className="w-full text-left bg-dark-2 border border-dark-3 rounded-xl px-5 py-3 hover:bg-dark-3 hover:border-gray-600 transition-all duration-200 disabled:opacity-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {s.title || "Sin título"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{timeAgo(s.timestamp)}</span>
                    <span className="text-gray-600">·</span>
                    <span className="text-xs text-gray-500 font-mono truncate">
                      {s.session_id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
                    s.status === "completed"
                      ? "bg-neon-green/10 text-neon-green"
                      : s.status === "error"
                      ? "bg-red-400/10 text-red-400"
                      : "bg-yellow-400/10 text-yellow-400"
                  }`}
                >
                  {s.status === "completed" ? "OK" : s.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
