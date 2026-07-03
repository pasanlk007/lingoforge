'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, subDays, isSameDay, startOfDay } from 'date-fns';

interface XPChartProps {
  dailyXpLog?: Record<string, number>;
}

export function XPChart({ dailyXpLog = {} }: XPChartProps) {
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    // Create data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const xp = dailyXpLog[dateKey] || 0;
      
      data.push({
        date: format(date, 'EEE'), // Mon, Tue, etc.
        xp: xp,
      });
    }
    return data;
  }, [dailyXpLog]);

  const chartConfig = {
    xp: {
      label: "XP Earned",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">Activity Progress</CardTitle>
        <CardDescription>XP earned over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              className="text-[10px] text-muted-foreground"
            />
            <YAxis 
               tickLine={false}
               axisLine={false}
               className="text-[10px] text-muted-foreground"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="xp"
              fill="var(--color-xp)"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
