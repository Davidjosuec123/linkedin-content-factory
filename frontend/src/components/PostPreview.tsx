import { useState, useRef } from "react"

interface Props {
  post: string
}

export default function PostPreview({ post }: Props) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLDivElement>(null)

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(post)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    } catch {
      // fallback for non-HTTPS contexts
    }

    const textarea = document.createElement("textarea")
    textarea.value = post
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand("copy")
    document.body.removeChild(textarea)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-dark-2 rounded-xl p-6 border border-dark-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Post de LinkedIn
        </h2>
        <button
          onClick={handleCopy}
          className="text-sm bg-neon-green/10 text-neon-green px-3 py-1.5 rounded-lg hover:bg-neon-green/20 transition-colors"
        >
          {copied ? "✓ Copiado" : "Copiar"}
        </button>
      </div>
      <div ref={preRef} className="prose prose-invert max-w-none whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-200">
        {post}
      </div>
    </div>
  )
}
