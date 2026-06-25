interface Stage {
  label: string
  status: "pending" | "processing" | "done" | "error"
}

interface Props {
  stages: Stage[]
}

export default function PipelineStatus({ stages }: Props) {
  return (
    <div className="space-y-2">
      {stages.map((s, i) => (
        <div key={i} className="flex items-center gap-3 font-mono text-sm">
          <div className="w-5 h-5 flex items-center justify-center">
            {s.status === "done" && <span className="text-neon-green">✓</span>}
            {s.status === "processing" && (
              <span className="w-3 h-3 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
            )}
            {s.status === "error" && <span className="text-red-400">✕</span>}
            {s.status === "pending" && <span className="text-dark-3">○</span>}
          </div>
          <span
            className={`${
              s.status === "done"
                ? "text-neon-green"
                : s.status === "processing"
                ? "text-neon-cyan"
                : s.status === "error"
                ? "text-red-400"
                : "text-gray-500"
            }`}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}
