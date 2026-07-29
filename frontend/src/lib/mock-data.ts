import type { Transformer, Zone } from '@/types/grid'

/**
 * Stand-in for the backend telemetry feed. Replaced by `services/` API calls once the
 * FastAPI generator and database land (Milestones 4-5).
 */
export const MOCK_GRID_NAME = 'Northeast Region Grid'

export const MOCK_ZONES: Zone[] = [
  {
    id: 'zone-a',
    name: 'Zone A — Downtown Core',
    transformers: [
      { id: 'T-101', zone: 'Zone A', type: 'Distribution Transformer', load: 62, predictedLoad: 65, voltage: 11.2, current: 312, tempC: 54, status: 'ok', lastUpdated: '13:48:22' },
      { id: 'T-102', zone: 'Zone A', type: 'Distribution Transformer', load: 58, predictedLoad: 61, voltage: 11.4, current: 291, tempC: 51, status: 'ok', lastUpdated: '13:48:19' },
      { id: 'T-104', zone: 'Zone A', type: 'Power Transformer', load: 89, predictedLoad: 96, voltage: 10.8, current: 448, tempC: 78, status: 'crit', lastUpdated: '13:48:30' },
    ],
  },
  {
    id: 'zone-b',
    name: 'Zone B — Industrial West',
    transformers: [
      { id: 'T-201', zone: 'Zone B', type: 'Distribution Transformer', load: 44, predictedLoad: 47, voltage: 11.5, current: 220, tempC: 42, status: 'ok', lastUpdated: '13:48:10' },
      { id: 'T-202', zone: 'Zone B', type: 'Power Transformer', load: 81, predictedLoad: 85, voltage: 10.9, current: 406, tempC: 69, status: 'warn', lastUpdated: '13:48:27' },
    ],
  },
  {
    id: 'zone-c',
    name: 'Zone C — Northern Suburbs',
    transformers: [
      { id: 'T-301', zone: 'Zone C', type: 'Distribution Transformer', load: 35, predictedLoad: 37, voltage: 11.6, current: 175, tempC: 38, status: 'ok', lastUpdated: '13:47:55' },
      { id: 'T-302', zone: 'Zone C', type: 'Distribution Transformer', load: 41, predictedLoad: 43, voltage: 11.5, current: 205, tempC: 40, status: 'ok', lastUpdated: '13:48:01' },
      { id: 'T-305', zone: 'Zone C', type: 'Power Transformer', load: 55, predictedLoad: 58, voltage: 11.3, current: 276, tempC: 48, status: 'ok', lastUpdated: '13:48:14' },
    ],
  },
]

export const MOCK_TRANSFORMERS: Transformer[] = MOCK_ZONES.flatMap((zone) => zone.transformers)

export function findTransformer(id: string | undefined): Transformer | undefined {
  if (!id) return undefined
  return MOCK_TRANSFORMERS.find((transformer) => transformer.id === id)
}
