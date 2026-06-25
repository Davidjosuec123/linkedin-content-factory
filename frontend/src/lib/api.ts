const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

export type StreamEvent =
  | { stage: "session"; status: "done"; session_id: string }
  | { stage: "transcription" | "extractor" | "redactor" | "disenador"; status: "processing" | "done" }
  | { stage: "extractor" | "redactor"; status: "error"; error: string; raw_structure?: string }
  | { stage: "disenador"; status: "error"; error: string }
  | { stage: "complete"; status: "done"; result: SessionResult }
  | { stage: "error"; status: "error"; error: string }

export interface DesignGuide {
  suggested_tools: string[]
  visual_artifacts: {
    tool: string
    description: string
    composition: string
    dark_mode: boolean
    neon_accent: string
  }[]
  blur_zones: string[]
  post_production_notes: string
  screenshot_count: number
  dark_mode: boolean
  neon_accent: string
  screenshot_notes: string
}

export interface SessionResult {
  session_id: string
  timestamp: string
  raw_structure: string
  linkedin_post: string
  design_guide: DesignGuide
}

export interface SessionSummary {
  session_id: string
  timestamp: string
  status: string
  title: string
}

export async function uploadAudio(file: File): Promise<SessionResult> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_BASE}/api/process`, {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || "Error processing audio")
  }

  return res.json()
}

export async function uploadAudioStream(
  file: File,
  onEvent: (event: StreamEvent) => void
): Promise<SessionResult> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_BASE}/api/process/stream`, {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error de conexión" }))
    throw new Error(err.detail || "Error processing audio")
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error("Stream not supported")

  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data: ")) continue
      try {
        const event: StreamEvent = JSON.parse(trimmed.slice(6))
        onEvent(event)
        if (event.stage === "complete" && event.status === "done") {
          return event.result
        }
        if (event.stage === "error" && event.status === "error") {
          throw new Error(event.error)
        }
      } catch (e) {
        if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
          throw e
        }
      }
    }
  }

  throw new Error("Stream ended without result")
}

export async function getSessions(limit = 20): Promise<SessionSummary[]> {
  const res = await fetch(`${API_BASE}/api/sessions?limit=${limit}`)
  return res.json()
}

export async function getSession(id: string): Promise<SessionResult> {
  const res = await fetch(`${API_BASE}/api/sessions/${id}`)
  if (!res.ok) throw new Error("Session not found")
  return res.json()
}
