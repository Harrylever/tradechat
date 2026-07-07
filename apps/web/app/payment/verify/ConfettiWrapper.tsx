'use client'

import { ReactNode } from 'react'

import Confetti from 'react-confetti-boom'

import { useConfettiContext } from './confetti-context'

export function ConfettiWrapper({ children }: { children: ReactNode }) {
  const { visible } = useConfettiContext()

  return (
    <>
      {children}
      {visible === 'visible' && (
        <Confetti mode="fall" particleCount={60} fadeOutHeight={0.9} />
      )}
    </>
  )
}
