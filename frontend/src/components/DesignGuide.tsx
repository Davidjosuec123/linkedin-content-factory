import type { DesignGuide as DesignGuideType } from "@/lib/api"

interface Props {
  guide: DesignGuideType
}

export default function DesignGuide({ guide }: Props) {
  return (
    <div className="bg-dark-2 rounded-xl p-6 border border-dark-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Guía Visual
      </h2>

      <div className="space-y-4 text-sm">
        <div>
          <span className="text-gray-500">Capturas sugeridas:</span>{" "}
          <span className="text-gray-200">{guide.screenshot_count}</span>
        </div>

        {guide.suggested_tools.length > 0 && (
          <div>
            <span className="text-gray-500">Herramientas:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {guide.suggested_tools.map((t) => (
                <span key={t} className="bg-neon-green/10 text-neon-green px-2 py-0.5 rounded text-xs">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {guide.visual_artifacts.map((a, i) => (
          <div key={i} className="border-l-2 border-neon-green pl-3">
            <p className="text-neon-green font-mono text-xs">{a.tool}</p>
            <p className="text-gray-200 mt-1">{a.description}</p>
            <p className="text-gray-500 text-xs mt-0.5">{a.composition}</p>
          </div>
        ))}

        {guide.blur_zones.length > 0 && (
          <div>
            <span className="text-red-400 text-xs font-medium">
              Zonas a difuminar:
            </span>
            <ul className="list-disc list-inside text-gray-400 text-xs mt-1">
              {guide.blur_zones.map((z, i) => (
                <li key={i}>{z}</li>
              ))}
            </ul>
          </div>
        )}

        {guide.screenshot_notes && (
          <div className="border-t border-dark-3 pt-3 mt-3">
            <p className="text-gray-400 text-xs italic">"{guide.screenshot_notes}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
