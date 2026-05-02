'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ScoreDistributionChartProps {
  data: Record<string, number>;
}

export function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
  const chartData = Object.entries(data).map(([range, count]) => ({
    range,
    count
  }));

  const total = Object.values(data).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Score Distribution</CardTitle>
        <CardDescription>
          Participants by score range (Total: {total})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip
              formatter={(value) => [`${value} participants`, 'Count']}
              labelStyle={{ color: '#000' }}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
              name="Participants"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
