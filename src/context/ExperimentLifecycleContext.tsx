import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface ExperimentLifecycleContextValue {
  now: Date
  simulatedNow: Date | null
  setSimulatedNow: (value: Date | null) => void
  setSimulatedOffsetDays: (offsetDays: number, baseEventEnd?: Date | null) => void
}

const ExperimentLifecycleContext = createContext<ExperimentLifecycleContextValue | null>(null)

export function ExperimentLifecycleProvider({ children }: { children: ReactNode }) {
  const [simulatedNow, setSimulatedNow] = useState<Date | null>(null)

  const value = useMemo<ExperimentLifecycleContextValue>(
    () => ({
      now: simulatedNow ?? new Date(),
      simulatedNow,
      setSimulatedNow,
      setSimulatedOffsetDays(offsetDays, baseEventEnd) {
        const anchor = baseEventEnd ?? new Date()
        const next = new Date(anchor)
        next.setDate(next.getDate() + offsetDays)
        setSimulatedNow(next)
      },
    }),
    [simulatedNow],
  )

  return (
    <ExperimentLifecycleContext.Provider value={value}>{children}</ExperimentLifecycleContext.Provider>
  )
}

export function useExperimentLifecycleNow(): Date {
  return useContext(ExperimentLifecycleContext)?.now ?? new Date()
}

export function useExperimentLifecycleControls() {
  const context = useContext(ExperimentLifecycleContext)
  if (!context) {
    throw new Error('useExperimentLifecycleControls must be used within ExperimentLifecycleProvider')
  }
  return context
}
