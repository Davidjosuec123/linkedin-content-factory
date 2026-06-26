import { useCallback, useRef, useState } from "react"

interface Props {
  onRecordingComplete: (file: File) => void
  disabled: boolean
}

export default function AudioRecorder({ onRecordingComplete, disabled }: Props) {
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        const ext = mediaRecorder.mimeType.includes("webm") ? "webm" : "mp3"
        const file = new File([blob], `grabacion-${Date.now()}.${ext}`, {
          type: mediaRecorder.mimeType,
        })
        onRecordingComplete(file)
        setDuration(0)
      }

      mediaRecorder.start(1000)
      setRecording(true)
      setPaused(false)

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch {
      setError("No se pudo acceder al micrófono. Verifica los permisos del navegador.")
    }
  }, [onRecordingComplete])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.pause()
      setPaused(true)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [recording])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.resume()
      setPaused(false)
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    }
  }, [recording])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      setPaused(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [recording])

  if (recording) {
    return (
      <div className="border-2 border-red-400 rounded-xl p-6 text-center bg-red-400/5">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="inline-block w-3 h-3 bg-red-400 rounded-full animate-pulse" />
          <p className="text-red-400 font-mono text-lg">{formatTime(duration)}</p>
        </div>

        <div className="flex items-center justify-center gap-3">
          {!paused ? (
            <button
              onClick={pauseRecording}
              className="px-4 py-2 bg-dark-3 border border-dark-3 rounded-lg text-gray-300 hover:bg-dark-2 transition-colors text-sm"
            >
              Pausar
            </button>
          ) : (
            <button
              onClick={resumeRecording}
              className="px-4 py-2 bg-dark-3 border border-dark-3 rounded-lg text-yellow-400 hover:bg-dark-2 transition-colors text-sm"
            >
              Reanudar
            </button>
          )}
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-400/20 border border-red-400/30 rounded-lg text-red-400 hover:bg-red-400/30 transition-colors text-sm font-medium"
          >
            Detener y enviar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
        ${disabled ? "opacity-50 pointer-events-none" : "border-dark-3 hover:border-neon-green hover:bg-neon-green/5"}`}
      onClick={startRecording}
    >
      <p className="text-2xl mb-2">🎙️</p>
      <p className="text-gray-300 font-medium">
        Grabar audio desde el micrófono
      </p>
      <p className="text-gray-500 text-sm mt-1">
        Click para empezar a grabar
      </p>
      {error && (
        <p className="text-red-400 text-sm mt-2">{error}</p>
      )}
    </div>
  )
}
