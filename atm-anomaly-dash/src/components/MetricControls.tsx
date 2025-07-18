import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface MetricControlsProps {
  metric: {
    key: string
    label: string
    color: string
  }
  params: Record<string, any>
  onParamChange: (metric: string, field: string, value: any) => void
  onContaminationBlur: (metric: string, value: number) => void
}

export function MetricControls({ 
  metric, 
  params, 
  onParamChange, 
  onContaminationBlur 
}: MetricControlsProps) {
  return (
    <Card className="bg-secondary/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: metric.color }}
          />
          {metric.label} Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${metric.key}-spikes`} className="text-xs font-medium text-foreground">
            Spikes
          </Label>
          <Input
            id={`${metric.key}-spikes`}
            type="number"
            min={0}
            max={10}
            value={params[`${metric.key}_spikes`]}
            onChange={(e) => onParamChange(metric.key, "spikes", Number(e.target.value))}
            className="h-8 text-sm bg-background border-border"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`${metric.key}-drops`} className="text-xs font-medium text-foreground">
            Drops
          </Label>
          <Input
            id={`${metric.key}-drops`}
            type="number"
            min={0}
            max={10}
            value={params[`${metric.key}_drops`]}
            onChange={(e) => onParamChange(metric.key, "drops", Number(e.target.value))}
            className="h-8 text-sm bg-background border-border"
          />
        </div>
      </CardContent>
    </Card>
  )
}