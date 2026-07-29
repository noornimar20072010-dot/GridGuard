/**
 * Health classification assigned by the deterministic prediction engine.
 * The frontend only renders this value — it never derives it from AI output.
 */
export type HealthStatus = 'ok' | 'warn' | 'crit'

export interface Transformer {
  id: string
  zone: string
  type: string
  /** Current load as a percentage of rated capacity. */
  load: number
  /** Forecast load percentage; null until there is enough history to project. */
  predictedLoad: number | null
  /** kV */
  voltage: number
  /** A */
  current: number
  /** °C */
  tempC: number
  status: HealthStatus
  lastUpdated: string
}

export interface Zone {
  id: string
  name: string
  transformers: Transformer[]
}
