import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface DataPoint {
  subject: string;
  company: number;
  industryAvg: number;
  bestInClass: number;
}

interface CosiriRadarBenchmarkProps {
  data: DataPoint[];
}

export function CosiriRadarBenchmark({ data }: CosiriRadarBenchmarkProps) {
  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
          <Radar
            name="Best-in-Class"
            dataKey="bestInClass"
            stroke="#22c55e"
            strokeWidth={1.5}
            fill="#22c55e"
            fillOpacity={0.08}
            strokeDasharray="4 2"
          />
          <Radar
            name="Industry Average"
            dataKey="industryAvg"
            stroke="#f59e0b"
            strokeWidth={1.5}
            fill="#f59e0b"
            fillOpacity={0.12}
            strokeDasharray="3 2"
          />
          <Radar
            name="Your Score"
            dataKey="company"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill="hsl(var(--primary))"
            fillOpacity={0.25}
          />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderRadius: '10px',
              border: '1px solid hsl(var(--border))',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [`Band ${value}`, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
