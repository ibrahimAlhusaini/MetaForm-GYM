import type { ReactNode } from 'react'

interface ChartContainerProps {
  children?: ReactNode
}

export function ResponsiveContainer({ children }: ChartContainerProps) {
  return <div data-testid="responsive-chart">{children}</div>
}

export function LineChart({ children }: ChartContainerProps) {
  return <div>{children}</div>
}

export function CartesianGrid() {
  return null
}

export function XAxis() {
  return null
}

export function YAxis() {
  return null
}

export function Tooltip() {
  return null
}

export function Line() {
  return null
}
