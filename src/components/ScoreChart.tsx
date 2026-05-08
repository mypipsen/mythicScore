import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../types';
import { CustomTooltip } from './CustomTooltip';

type ScoreChartProps = {
  data: ChartDataPoint[];
  grouping: 'day' | 'week';
};

export const ScoreChart: React.FC<ScoreChartProps> = ({ data, grouping }) => {
  const getTicks = () => {
    if (!data || data.length === 0) return [];
    if (grouping === 'week') {
      return data.map(d => d.timestamp);
    }

    const min = data[0].timestamp;
    const max = data[data.length - 1].timestamp;
    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.round((max - min) / dayMs);

    const ticks = [];
    const step = Math.max(1, Math.ceil(days / 7)); // aim for ~7 ticks to avoid crowding
    for (let i = 0; i <= days; i += step) {
      const d = new Date(min);
      d.setDate(d.getDate() + i);
      ticks.push(d.getTime());
    }
    return ticks;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          stroke="#94a3b8"
          tick={{ fill: '#94a3b8' }}
          tickMargin={10}
          ticks={getTicks()}
          interval={0}
          tickFormatter={(tick) => {
            const match = data.find(d => d.timestamp === tick);
            if (match) {
              return grouping === 'week' ? match.date.split(' (')[0] : match.date;
            }
            return new Date(tick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis
          stroke="#94a3b8"
          tick={{ fill: '#94a3b8' }}
          tickMargin={10}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip grouping={grouping} />} wrapperStyle={{ pointerEvents: 'auto' }} />
        <Area
          type="monotone"
          dataKey="totalScore"
          stroke="#a78bfa"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorScore)"
          animationDuration={1500}
          animationEasing="ease-in-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
