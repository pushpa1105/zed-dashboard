import { AreaChart } from '@/shared/components/charts/area-chart';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { Gauge } from '@/shared/components/charts/gauge';
import { Heatmap } from '@/shared/components/charts/heatmap';
import { LineChart } from '@/shared/components/charts/line-chart';
import { ProgressRing } from '@/shared/components/charts/progress-ring';
import { RadarChart } from '@/shared/components/charts/radar-chart';
import { RadialChart } from '@/shared/components/charts/radial-chart';
import { Sparkline } from '@/shared/components/charts/sparkline';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { ElementsPage } from '../components/elements-page';
import { ChartDemo, Demo, ShowcaseGrid } from '../components/showcase';
import {
  forecast,
  goals,
  HEAT_DAYS,
  HEAT_HOURS,
  heatValues,
  ordersByChannel,
  revenueByMonth,
  skills,
  sparkRows,
  topProducts,
  trafficBySource,
  trafficShare,
  weeklySignups,
} from '../data/samples';

const money = (v: number) => `$${(v / 1000).toFixed(v >= 100_000 ? 0 : 1)}k`;

export default function ChartsPage() {
  return (
    <ElementsPage page="charts">
      <ShowcaseGrid>
        <ChartDemo
          id="area"
          table={{
            columns: ['Month', 'Revenue', 'Expenses'],
            rows: revenueByMonth.map((r) => [r.month, r.revenue, r.expenses]),
          }}
        >
          <AreaChart
            data={revenueByMonth}
            xKey="month"
            series={[
              { key: 'revenue', label: 'Revenue' },
              { key: 'expenses', label: 'Expenses' },
            ]}
            valueFormatter={money}
          />
        </ChartDemo>

        <ChartDemo
          id="areaStacked"
          table={{
            columns: ['Month', 'Organic', 'Paid', 'Referral'],
            rows: trafficBySource.map((r) => [r.month, r.organic, r.paid, r.referral]),
          }}
        >
          <AreaChart
            data={trafficBySource}
            xKey="month"
            stacked
            curve="monotone"
            series={[
              { key: 'organic', label: 'Organic' },
              { key: 'paid', label: 'Paid' },
              { key: 'referral', label: 'Referral' },
            ]}
          />
        </ChartDemo>

        <ChartDemo
          id="line"
          table={{
            columns: ['Month', 'Actual', 'Forecast'],
            rows: forecast.map((r) => [r.month, r.actual ?? '—', r.forecast ?? '—']),
          }}
        >
          <LineChart
            data={forecast}
            xKey="month"
            dots
            dashed={['forecast']}
            target={{ value: 200, label: 'Target 200' }}
            series={[
              { key: 'actual', label: 'Actual' },
              { key: 'forecast', label: 'Forecast', color: 'var(--chart-1)' },
            ]}
          />
        </ChartDemo>

        <ChartDemo
          id="barGrouped"
          table={{
            columns: ['Day', 'Online', 'Retail', 'Partners'],
            rows: ordersByChannel.map((r) => [r.day, r.online, r.retail, r.partners]),
          }}
        >
          <BarChart
            data={ordersByChannel}
            xKey="day"
            barSize={14}
            series={[
              { key: 'online', label: 'Online' },
              { key: 'retail', label: 'Retail' },
              { key: 'partners', label: 'Partners' },
            ]}
          />
        </ChartDemo>

        <ChartDemo
          id="barStacked"
          table={{
            columns: ['Day', 'Online', 'Retail', 'Partners'],
            rows: ordersByChannel.map((r) => [r.day, r.online, r.retail, r.partners]),
          }}
        >
          <BarChart
            data={ordersByChannel}
            xKey="day"
            mode="stacked"
            series={[
              { key: 'online', label: 'Online' },
              { key: 'retail', label: 'Retail' },
              { key: 'partners', label: 'Partners' },
            ]}
          />
        </ChartDemo>

        <ChartDemo
          id="barHorizontal"
          table={{
            columns: ['Product', 'Units'],
            rows: topProducts.map((r) => [r.product, r.units]),
          }}
        >
          <BarChart
            data={topProducts}
            xKey="product"
            horizontal
            barSize={18}
            className="[&_.recharts-yAxis_text]:text-[11px]"
            series={[{ key: 'units', label: 'Units sold' }]}
          />
        </ChartDemo>

        <ChartDemo
          id="barHighlight"
          table={{
            columns: ['Week', 'Sign-ups'],
            rows: weeklySignups.map((r) => [r.week, r.signups]),
          }}
        >
          <BarChart
            data={weeklySignups}
            xKey="week"
            highlight="last"
            radius={6}
            barSize={36}
            series={[{ key: 'signups', label: 'Sign-ups' }]}
          />
        </ChartDemo>

        <ChartDemo
          id="donut"
          table={{
            columns: ['Source', 'Sessions'],
            rows: trafficShare.map((r) => [r.label, r.value]),
          }}
        >
          <DonutChart data={trafficShare} centerLabel="Sessions" className="min-h-64" />
        </ChartDemo>

        <ChartDemo
          id="donutHalf"
          table={{
            columns: ['Source', 'Sessions'],
            rows: trafficShare.slice(0, 3).map((r) => [r.label, r.value]),
          }}
        >
          <DonutChart
            data={trafficShare.slice(0, 3)}
            shape="half"
            thickness={0.22}
            legend="bottom"
            centerLabel="Top 3 sources"
          />
        </ChartDemo>

        <ChartDemo
          id="radial"
          table={{
            columns: ['Stage', 'Complete (%)'],
            rows: goals.map((g) => [g.label, g.value]),
          }}
        >
          <RadialChart data={goals} className="min-h-64" />
        </ChartDemo>

        <ChartDemo
          id="radar"
          table={{
            columns: ['Dimension', 'Our product', 'Market avg.'],
            rows: skills.map((s) => [s.axis, s.ours, s.market]),
          }}
        >
          <RadarChart
            data={skills}
            axisKey="axis"
            series={[
              { key: 'ours', label: 'Our product' },
              { key: 'market', label: 'Market avg.' },
            ]}
          />
        </ChartDemo>

        <Demo id="sparklines" contentClassName="px-0 pb-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Metric</TableHead>
                <TableHead className="text-right">Now</TableHead>
                <TableHead className="pr-5">Last 10 weeks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sparkRows.map((row, i) => (
                <TableRow key={row.metric}>
                  <TableCell className="pl-5 font-medium">{row.metric}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.value}</TableCell>
                  <TableCell className="pr-5">
                    <Sparkline
                      data={row.data}
                      variant={i === 3 ? 'bar' : i === 2 ? 'line' : 'area'}
                      color={`var(--chart-${(i % 5) + 1})`}
                      label={`${row.metric}, last 10 weeks`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Demo>

        <ChartDemo
          id="gauge"
          table={{
            columns: ['Gauge', 'Value (%)'],
            rows: [
              ['Success rate', 51.2],
              ['Uptime target', 78],
            ],
          }}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <Gauge value={51.2} display="51.2%" label="Success rate" />
            <Gauge value={78} variant="arc" label="Uptime target" color="var(--chart-2)" />
          </div>
        </ChartDemo>

        <ChartDemo
          id="rings"
          table={{
            columns: ['Item', 'Progress (%)'],
            rows: [
              ['Onboarding', 25],
              ['Profile', 60],
              ['Integrations', 85],
              ['Billing', 100],
            ],
          }}
        >
          <div className="flex flex-wrap items-center justify-around gap-6 py-6">
            {[
              ['Onboarding', 25],
              ['Profile', 60],
              ['Integrations', 85],
              ['Billing', 100],
            ].map(([label, value], i) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <ProgressRing
                  value={value as number}
                  size={i === 3 ? 72 : 64}
                  color={`var(--chart-${i + 1})`}
                />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </ChartDemo>

        <ChartDemo
          id="heatmap"
          className="lg:col-span-2"
          table={{
            columns: ['Day', ...HEAT_HOURS],
            rows: HEAT_DAYS.map((day, d) => [day, ...heatValues[d]!]),
          }}
        >
          <Heatmap
            rows={HEAT_DAYS}
            columns={HEAT_HOURS}
            values={heatValues}
            valueFormatter={(v) => `${v} sessions`}
          />
        </ChartDemo>
      </ShowcaseGrid>
    </ElementsPage>
  );
}
