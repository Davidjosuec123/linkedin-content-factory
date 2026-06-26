import { useCallback, useRef, useState } from "react"
import AudioRecorder from "./AudioRecorder"

interface Props {
  onFileSelected: (file: File) => void
  disabled: boolean
}

export default function AudioUploader({ onFileSelected, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [mode, setMode] = useState<"upload" | "record">("upload")

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("audio/")) return
      setSelectedFile(file)
      onFileSelected(file)
    },
    [onFileSelected]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 bg-dark-2 p-1 rounded-xl border border-dark-3">
        <button
          onClick={() => setMode("upload")}
          disabled={disabled}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
            mode === "upload"
              ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
              : "text-gray-400 hover:text-gray-200 hover:bg-dark-3"
          }`}
        >
          📁 Subir archivo
        </button>
        <button
          onClick={() => setMode("record")}
          disabled={disabled}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
            mode === "record"
              ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
              : "text-gray-400 hover:text-gray-200 hover:bg-dark-3"
          }`}
        >
          🎙️ Grabar audio
        </button>
      </div>

      {/* Content */}
      {mode === "upload" ? (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
            ${dragOver ? "border-neon-green bg-neon-green/5" : "border-dark-3 hover:border-gray-500"}
            ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            onChange={handleChange}
            className="hidden"
          />
          {selectedFile ? (
            <div>
              <p className="text-neon-green font-mono text-lg">{selectedFile.name}</p>
              <p className="text-gray-400 text-sm mt-1">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-3xl mb-2">🎤</p>
              <p className="text-gray-300 font-medium">
                Arrastra tu audio aquí o haz clic para seleccionar
              </p>
              <p className="text-gray-500 text-sm mt-1">
                MP3, WAV, WEBM · Máx 2 min
              </p>
            </div>
          )}
        </div>
      ) : (
        <AudioRecorder onRecordingComplete={handleFile} disabled={disabled} />
      )}
    </div>
  )
}
