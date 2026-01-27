"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { Question } from "@/lib/db/schema";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

type QuestionStats = Question & {
  stats:
    | {
        type: "options";
        data: { name: string; value: number }[];
      }
    | {
        type: "numeric";
        average: number;
        distribution: { name: string; value: number }[];
      }
    | {
        type: "text";
        count: number;
      };
};

interface AnalyticsChartsProps {
  questionStats: QuestionStats[];
}

export function AnalyticsCharts({ questionStats }: AnalyticsChartsProps) {
  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      short_text: "Teks Pendek",
      paragraph: "Paragraf",
      multiple_choice: "Pilihan Ganda",
      checkboxes: "Kotak Centang",
      dropdown: "Dropdown",
      date: "Tanggal",
      time: "Waktu",
      file_upload: "Upload File",
      linear_scale: "Skala Linear",
      rating: "Rating",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {questionStats.map((question, index) => (
        <Card key={question.id}>
          <CardHeader>
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {index + 1}
              </span>
              <div className="flex-1">
                <CardTitle className="text-base">
                  {question.label}
                  {question.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </CardTitle>
                <CardDescription>
                  <Badge variant="outline" className="mt-1">
                    {getQuestionTypeLabel(question.type)}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {question.stats.type === "options" && (
              <OptionsChart data={question.stats.data} />
            )}
            {question.stats.type === "numeric" && (
              <NumericChart
                average={question.stats.average}
                distribution={question.stats.distribution}
              />
            )}
            {question.stats.type === "text" && (
              <TextStats count={question.stats.count} />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OptionsChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Belum ada jawaban
      </p>
    );
  }

  const chartConfig: ChartConfig = {};
  data.forEach((item, i) => {
    chartConfig[item.name] = {
      label: item.name,
      color: COLORS[i % COLORS.length],
    };
  });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <ChartContainer config={chartConfig} className="h-[200px]">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{item.value}</span>
              <span className="text-sm text-muted-foreground">
                ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumericChart({
  average,
  distribution,
}: {
  average: number;
  distribution: { name: string; value: number }[];
}) {
  const total = distribution.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Belum ada jawaban
      </p>
    );
  }

  const chartConfig: ChartConfig = {
    value: {
      label: "Jumlah",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-muted rounded-lg">
        <p className="text-3xl font-bold">{average}</p>
        <p className="text-sm text-muted-foreground">Rata-rata</p>
      </div>
      <ChartContainer config={chartConfig} className="h-[200px]">
        <BarChart data={distribution}>
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" fill="var(--color-value)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function TextStats({ count }: { count: number }) {
  return (
    <div className="text-center p-6 bg-muted rounded-lg">
      <p className="text-3xl font-bold">{count}</p>
      <p className="text-sm text-muted-foreground">Jawaban teks</p>
    </div>
  );
}
