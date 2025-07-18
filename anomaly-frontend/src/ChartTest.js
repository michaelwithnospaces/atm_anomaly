import * as React from 'react';
import Typography from '@mui/material/Typography';
import { ChartContainer } from '@mui/x-charts/ChartContainer';
import { LinePlot } from '@mui/x-charts/LineChart';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsAxisHighlight } from '@mui/x-charts/ChartsAxisHighlight';

export default function ChartTest({ data, metricLabel }) {
  // Prepare series for MUI X Charts
  const series = [
    {
      type: 'line',
      yAxisId: 'value',
      color: '#1976d2',
      label: metricLabel,
      data: data.map((row) => row.value),
      highlightScope: { highlight: 'item' },
    },
    {
      type: 'line',
      yAxisId: 'upper',
      color: '#00c49f',
      label: 'Upper Bound',
      data: data.map((row) => row.upper),
      highlightScope: { highlight: 'none' },
    },
    {
      type: 'line',
      yAxisId: 'lower',
      color: '#ff0000',
      label: 'Lower Bound',
      data: data.map((row) => row.lower),
      highlightScope: { highlight: 'none' },
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      <Typography>{metricLabel} Over Time</Typography>
      <div>
        <ChartContainer
          series={series}
          height={400}
          xAxis={[
            {
              id: 'timestamp',
              data: data.map((row) => row.timestamp),
              scaleType: 'band',
              valueFormatter: (value) => value,
              height: 40,
            },
          ]}
          yAxis={[
            { id: 'value', scaleType: 'linear', position: 'left', width: 50 },
            { id: 'upper', scaleType: 'linear', position: 'left', width: 50, visible: false },
            { id: 'lower', scaleType: 'linear', position: 'left', width: 50, visible: false },
          ]}
        >
          <ChartsAxisHighlight x="line" />
          <LinePlot />
          <ChartsXAxis
            label="Timestamp"
            axisId="timestamp"
            tickLabelStyle={{ fontSize: 10 }}
          />
          <ChartsYAxis
            label={metricLabel}
            axisId="value"
            tickLabelStyle={{ fontSize: 10 }}
          />
          <ChartsTooltip />
        </ChartContainer>
      </div>
    </div>
  );
}
