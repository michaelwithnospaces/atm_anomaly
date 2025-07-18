import { Card } from "@/components/ui/card"

const legendItems = [
  { 
    type: "line", 
    color: "hsl(var(--chart-1))", 
    label: "Metric Value", 
    description: "The actual recorded values" 
  },
  { 
    type: "line", 
    color: "hsl(var(--success))", 
    label: "Upper Bound", 
    description: "Normal range upper limit",
    dashed: true 
  },
  { 
    type: "line", 
    color: "hsl(var(--error))", 
    label: "Lower Bound", 
    description: "Normal range lower limit",
    dashed: true 
  },
  { 
    type: "dot", 
    color: "hsl(var(--error))", 
    label: "Anomaly", 
    description: "Detected anomalous values" 
  },
]

export function Legend() {
  return (
    <Card className="p-6 mb-6 bg-gradient-to-b from-card to-accent/10 border-border">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Chart Legend</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8">
              {item.type === "line" ? (
                <div 
                  className={`w-6 h-0.5 ${item.dashed ? 'border-t-2 border-dashed' : ''}`}
                  style={{ 
                    backgroundColor: item.dashed ? 'transparent' : item.color,
                    borderColor: item.dashed ? item.color : 'transparent' 
                  }}
                />
              ) : (
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
            </div>
            <div>
              <div className="font-medium text-sm text-foreground">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}