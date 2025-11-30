import { useOutletContext } from 'react-router-dom'

import type { LayoutControls } from './MainLayout'

const noop = () => {
  /* layout context unavailable */
}

export function usePageLayout(): LayoutControls {
  const context = useOutletContext<LayoutControls | undefined>()

  if (!context) {
    return {
      setLayout: noop,
      resetLayout: noop,
    }
  }

  return context
}
