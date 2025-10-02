'use client'

import '@/lib/i18n'
import type { PropsWithChildren } from 'react'

export default function I18nProvider({ children }: PropsWithChildren) {
  return <>{children}</>
}
