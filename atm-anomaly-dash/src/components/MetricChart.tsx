import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Dot } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MetricChartProps {
  title: string
  data: any[]
  color: string
}

export function MetricChart({ title, data, color }: MetricChartProps) {
  return (
    <Card className="bg-gradient-to-br from-card via-card to-accent/5 border-border shadow-card hover:shadow-elevated transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-foreground text-lg font-semibold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <LineChart width={400} height={300} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="timestamp" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
            />
            <YAxis 
              tickCount={9}
              domain={[0, 400]} 
              interval={0} 
              tickFormatter={(v) => v.toString()}
              ticks={[0, 50, 100, 150, 200, 250, 300, 350, 400]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                color: "hsl(var(--popover-foreground))",
                fontSize: "12px"
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: "12px", color: "hsl(var(--foreground))" }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              name={title}
              strokeWidth={2}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="upper" 
              stroke="hsl(var(--success))" 
              strokeDasharray="5 5" 
              name="Upper Bound"
              strokeWidth={1.5}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="lower" 
              stroke="hsl(var(--error))" 
              strokeDasharray="5 5" 
              name="Lower Bound"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              dot={(props: any) =>
                props.payload.anomaly ? (
                  <Dot {...props} r={4} fill="hsl(var(--error))" stroke="hsl(var(--background))" strokeWidth={2} />
                ) : null
              }
              strokeOpacity={0}
              legendType="none"
            />
          </LineChart>
        </div>
      </CardContent>
    </Card>
  )
}