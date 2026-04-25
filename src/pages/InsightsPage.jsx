import { useEffect, useMemo, useState } from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfYear,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfYear
} from 'date-fns';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SectionCard } from '../components/ui/SectionCard';
import { useBakery } from '../context/BakeryContext';
import { subscribeToSalesRange } from '../services/salesService';
import { formatCurrency } from '../utils/money';

function buildSparklinePath(values, width = 120, height = 28) {
  if (!values.length) {
    return '';
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = values.length === 1 ? width : width / (values.length - 1);

  return values
    .map((value, index) => {
      const x = Number((index * step).toFixed(2));
      const y = Number((height - ((value - min) / range) * (height - 6) - 3).toFixed(2));
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function Sparkline({ values, color }) {
  const path = useMemo(() => buildSparklinePath(values), [values]);

  return (
    <svg className="metric-spark" viewBox="0 0 120 28" preserveAspectRatio="none" aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InsightTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chart-tooltip glass-card">
      <strong>{formatCurrency(payload[0].value)}</strong>
      <div className="tiny">{label} {format(new Date(), 'MMM')}</div>
    </div>
  );
}

export default function InsightsPage() {
  const { bakeryId } = useBakery();
  const [sales, setSales] = useState([]);
  const [metric, setMetric] = useState('revenue');
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  useEffect(() => subscribeToSalesRange(bakeryId, setSales), [bakeryId]);

  const now = new Date();
  const monthlySales = useMemo(
    () => sales.filter((item) => isSameMonth(new Date(`${item.dateKey}T12:00:00`), now)),
    [now, sales]
  );

  const yearlySales = useMemo(
    () =>
      sales.filter((item) => {
        const date = new Date(`${item.dateKey}T12:00:00`);
        return date >= startOfYear(now) && date <= endOfYear(now);
      }),
    [now, sales]
  );

  const chartData = useMemo(() => {
    const dates = eachDayOfInterval({
      start: startOfMonth(now),
      end: endOfMonth(now)
    });

    return dates.map((date) => {
      const key = format(date, 'yyyy-MM-dd');
      const daySales = sales.filter((item) => item.dateKey === key);
      return {
        key,
        label: format(date, 'd'),
        revenue: daySales.reduce((total, item) => total + Number(item.revenue || 0), 0),
        profit: daySales.reduce((total, item) => total + Number(item.profit || 0), 0)
      };
    });
  }, [now, sales]);

  const yearlyChartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const monthSales = yearlySales.filter((item) => {
        const date = new Date(`${item.dateKey}T12:00:00`);
        return date.getMonth() === index;
      });

      return {
        label: format(new Date(now.getFullYear(), index, 1), 'MMM'),
        revenue: monthSales.reduce((total, item) => total + Number(item.revenue || 0), 0),
        profit: monthSales.reduce((total, item) => total + Number(item.profit || 0), 0)
      };
    });
  }, [now, yearlySales]);

  const monthlyTotals = monthlySales.reduce(
    (accumulator, item) => ({
      revenue: accumulator.revenue + Number(item.revenue || 0),
      profit: accumulator.profit + Number(item.profit || 0)
    }),
    { revenue: 0, profit: 0 }
  );

  const yearlyTotals = yearlySales.reduce(
    (accumulator, item) => ({
      revenue: accumulator.revenue + Number(item.revenue || 0),
      profit: accumulator.profit + Number(item.profit || 0)
    }),
    { revenue: 0, profit: 0 }
  );

  const selectedDayData =
    chartData.find((item) => item.key === selectedDateKey) ||
    chartData.find((item) => item.key === format(now, 'yyyy-MM-dd'));

  const monthlyRevenueSeries = chartData.map((item) => item.revenue);
  const monthlyProfitSeries = chartData.map((item) => item.profit);
  const yearlyRevenueSeries = yearlyChartData.map((item) => item.revenue);
  const yearlyProfitSeries = yearlyChartData.map((item) => item.profit);

  return (
    <div className="page">
      <section className="glass-card hero-card">
        <div className="hero-kicker">
          <span className="hero-emoji" aria-hidden="true">{'\uD83D\uDCCA'}</span>
          <span className="tiny">Business snapshot</span>
        </div>
        <h1 className="page-title">Insights</h1>
        <p className="page-subtitle">A calm read on how sales and profit are moving this month.</p>
      </section>

      <SectionCard>
        <div className="metrics">
          <div className="glass-card metric metric-trend green">
            <div className="metric-label">Monthly revenue</div>
            <div className="metric-value">{formatCurrency(monthlyTotals.revenue)}</div>
            <Sparkline values={monthlyRevenueSeries} color="#79d8ac" />
          </div>
          <div className="glass-card metric metric-trend pink">
            <div className="metric-label">Monthly profit</div>
            <div className="metric-value">{formatCurrency(monthlyTotals.profit)}</div>
            <Sparkline values={monthlyProfitSeries} color="#ff84c5" />
          </div>
          <div className="glass-card metric metric-trend purple">
            <div className="metric-label">Yearly revenue</div>
            <div className="metric-value">{formatCurrency(yearlyTotals.revenue)}</div>
            <Sparkline values={yearlyRevenueSeries} color="#ba84ff" />
          </div>
          <div className="glass-card metric metric-trend blue">
            <div className="metric-label">Yearly profit</div>
            <div className="metric-value">{formatCurrency(yearlyTotals.profit)}</div>
            <Sparkline values={yearlyProfitSeries} color="#7ebcff" />
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="page-header">
          <strong>{metric === 'revenue' ? 'Revenue trend' : 'Profit trend'}</strong>
          <div className="segmented" style={{ width: 180 }}>
            <button type="button" className={metric === 'revenue' ? 'active' : ''} onClick={() => setMetric('revenue')}>
              Revenue
            </button>
            <button type="button" className={metric === 'profit' ? 'active' : ''} onClick={() => setMetric('profit')}>
              Profit
            </button>
          </div>
        </div>
        <div className="insights-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 6, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metric === 'revenue' ? '#ff7dbf' : '#ba84ff'} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={metric === 'revenue' ? '#ff7dbf' : '#ba84ff'} stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="metricStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ff88c7" />
                  <stop offset="100%" stopColor="#b48cff" />
                </linearGradient>
                <filter id="lineGlow" x="-20%" y="-80%" width="140%" height="220%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="1 0 0 0 0
                            0 1 0 0 0
                            0 0 1 0 0
                            0 0 0 0.45 0"
                    result="glow"
                  />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid stroke="rgba(145, 123, 160, 0.12)" vertical={false} />
              <XAxis dataKey="label" stroke="#9587a8" tickLine={false} axisLine={false} />
              <YAxis stroke="#9587a8" tickLine={false} axisLine={false} width={44} />
              <Tooltip content={<InsightTooltip />} cursor={{ stroke: 'rgba(186,132,255,0.16)', strokeWidth: 2 }} />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={metric === 'revenue' ? '#ff68b7' : '#ba84ff'}
                fill="url(#metricFill)"
                strokeWidth={4}
                dot={false}
                isAnimationActive
                animationDuration={420}
                activeDot={{
                  r: 7,
                  strokeWidth: 3,
                  fill: metric === 'revenue' ? '#ff68b7' : '#ba84ff',
                  stroke: 'rgba(255,255,255,0.95)'
                }}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke="url(#metricStroke)"
                strokeWidth={4}
                dot={false}
                filter="url(#lineGlow)"
                isAnimationActive
                animationDuration={420}
                activeDot={{
                  r: 7,
                  strokeWidth: 3,
                  fill: metric === 'revenue' ? '#ff68b7' : '#ba84ff',
                  stroke: 'rgba(255,255,255,0.95)'
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard>
        <strong>Calendar</strong>
        <div className="calendar-grid" style={{ marginTop: 16 }}>
          {chartData.map((item) => {
            const activityValue = metric === 'revenue' ? item.revenue : item.profit;
            const intensity = Math.min(activityValue / Math.max(1, ...chartData.map((entry) => entry[metric])), 1);
            const selected = item.key === selectedDayData?.key;

            return (
              <button
                key={item.key}
                type="button"
                className={`glass-card calendar-day ${selected ? 'selected' : ''}`}
                onClick={() => setSelectedDateKey(item.key)}
                style={{
                  background: isToday(new Date(`${item.key}T12:00:00`))
                    ? 'rgba(211, 111, 147, 0.18)'
                    : `rgba(233,213,255,${0.18 + intensity * 0.48})`
                }}
              >
                <div className="tiny calendar-day-label">{item.label}</div>
              </button>
            );
          })}
        </div>
        {selectedDayData ? (
          <div className="glass-card surface-card" style={{ marginTop: 14 }}>
            <div className="list-item" style={{ padding: 0 }}>
              <div>
                <strong>{format(new Date(`${selectedDayData.key}T12:00:00`), 'EEE, d MMM')}</strong>
                <div className="tiny">Selected day</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>{formatCurrency(selectedDayData.revenue)}</strong>
                <div className="tiny">{formatCurrency(selectedDayData.profit)} profit</div>
              </div>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
