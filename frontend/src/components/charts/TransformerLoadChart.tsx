import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TelemetryData {
  id: string;
  transformer_id: string;
  load: number;
  voltage: number;
  current: number;
  temperature: number;
  recorded_at: string;
}

interface ChartData {
  time: string;
  load: number;
  temp: number;
}

interface TransformerLoadChartProps {
  transformerId: string;
  critThreshold?: number;
  warnThreshold?: number;
}

export function TransformerLoadChart({
  transformerId,
  critThreshold = 90,
  warnThreshold = 75,
}: TransformerLoadChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/transformers/${transformerId}/telemetry`);

        if (!response.ok) {
          throw new Error(`Failed to fetch telemetry: ${response.statusText}`);
        }

        const telemetry: TelemetryData[] = await response.json();

        const chartData = telemetry.map((item) => ({
          time: new Date(item.recorded_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          load: item.load,
          temp: item.temperature,
        }));

        setData(chartData);
        setError(null);
      } catch (err) {
        let message = 'Failed to load chart data';
        if (err instanceof Error) {
          message = err.message;
        }
        setError(message);
        console.error('Telemetry fetch error:', err);
        console.error('Transformer ID:', transformerId);
        console.error('Endpoint:', `/transformers/${transformerId}/telemetry`);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, [transformerId]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-raised/30 border border-white/5 rounded-lg">
        <p className="text-slate-200">Loading chart data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-raised/30 border border-white/5 rounded-lg">
        <p className="text-sm text-slate-300">Chart data unavailable</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-raised/30 border border-white/5 rounded-lg">
        <p className="text-slate-200">No telemetry data available yet</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-raised/30 border border-white/5 rounded-lg p-4">
      <p className="font-mono text-sm uppercase tracking-[0.1em] text-slate-200 mb-3">Load Trend</p>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            stroke="#475569"
          />
          <YAxis
            yAxisId="left"
            label={{ value: 'Load (%)', angle: -90, position: 'insideLeft' }}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            stroke="#475569"
            domain={[0, 100]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: 'Temp (°C)', angle: 90, position: 'insideRight' }}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            stroke="#475569"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
            }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="line"
          />
          <ReferenceLine
            yAxisId="left"
            y={critThreshold}
            stroke="#ef4444"
            strokeDasharray="5 5"
            label={{
              value: `Critical (${critThreshold}%)`,
              position: 'right',
              fill: '#ef4444',
              fontSize: 11,
            }}
          />
          <ReferenceLine
            yAxisId="left"
            y={warnThreshold}
            stroke="#f0a92e"
            strokeDasharray="5 5"
            label={{
              value: `Warning (${warnThreshold}%)`,
              position: 'right',
              fill: '#f0a92e',
              fontSize: 11,
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="load"
            stroke="#21d07a"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="Load"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="temp"
            stroke="#ec7014"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="Temperature"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
