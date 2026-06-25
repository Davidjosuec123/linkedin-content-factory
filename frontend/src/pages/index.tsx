import { useState } from "react"
import AudioUploader from "@/components/AudioUploader"
import PipelineStatus from "@/components/PipelineStatus"
import PostPreview from "@/components/PostPreview"
import DesignGuide from "@/components/DesignGuide"
import { uploadAudioStream, type SessionResult, type StreamEvent } from "@/lib/api"

type StageName = "Transcripción" | "Extractor" | "Redactor" | "Diseñador"
type StageStatus = "pending" | "processing" | "done" | "error"

const STAGE_LABELS: Record<string, StageName> = {
  transcription: "Transcripción",
  extractor: "Extractor",
  redactor: "Redactor",
  disenador: "Diseñador",
}

const STAGE_ORDER: string[] = ["transcription", "extractor", "redactor", "disenador"]

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [stages, setStages] = useState<
    { label: StageName; status: StageStatus }[]
  >(STAGE_ORDER.map((key) => ({ label: STAGE_LABELS[key], status: "pending" })))
  const [result, setResult] = useState<SessionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setLoading(true)
    setError(null)
    setResult(null)
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
    </div>
  )
}
