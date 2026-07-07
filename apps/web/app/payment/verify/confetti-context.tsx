'use client'

import { createContext, ReactNode, useContext, useMemo, useState } from 'react'

export type DisplayState = 'none' | 'visible'

interface ConfettiContextType {
  visible: DisplayState
  setVisible: (state: DisplayState) => void
}

const ConfettiContext = createContext<ConfettiContextType>({
  visible: 'none',
  setVisible: () => {},
})

export const ConfettiProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState<DisplayState>('none')

  const value = useMemo(
    () => ({
      visible,
      setVisible,
    }),
    [visible, setVisible],
  )

  return (
    <ConfettiContext.Provider value={value}>
      {children}
    </ConfettiContext.Provider>
  )
}

export const useConfettiContext = () => {
  const context = useContext(ConfettiContext)

  if (!context) {
    throw new Error(
      'useConfettiContext must be used within an ConfettiProvider',
    )
  }

  return context
}
