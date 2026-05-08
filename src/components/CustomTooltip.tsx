import { ChartDataPoint } from '../types';

export const CustomTooltip = ({ active, payload, grouping }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload as ChartDataPoint;
    return (
      <div className="custom-tooltip">
        <p>{dataPoint.date}</p>
        <p className="score">
          Total Score: {dataPoint.totalScore.toFixed(1)}
          {dataPoint.scoreIncrease > 0 && (
            <span style={{ color: '#10b981', marginLeft: '6px', fontSize: '0.85em' }}>
              (+{dataPoint.scoreIncrease.toFixed(1)})
            </span>
          )}
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
          {dataPoint.allRuns.length} run{dataPoint.allRuns.length > 1 ? 's' : ''} {grouping === 'day' ? 'today' : 'this week'}:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
          {dataPoint.allRuns.map((r, i) => (
            <p key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
              {r.dungeon} +{r.level} ({r.score.toFixed(1)})
              {r.isDepleted && (
                <span style={{ color: '#ef4444', marginLeft: '4px', fontSize: '0.85em', fontWeight: 600 }}>
                  (Depleted)
                </span>
              )}
              {r.runScoreIncrease > 0 && (
                <span style={{ color: '#10b981', marginLeft: '4px' }}>
                  (+{r.runScoreIncrease.toFixed(1)})
                </span>
              )}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};
