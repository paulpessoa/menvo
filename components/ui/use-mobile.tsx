import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Check if window is available (SSR)
    if (typeof window === 'undefined') return false
    
    // Check if we have a stored viewport width (from OAuth redirect)
    const storedWidth = sessionStorage.getItem('viewportWidth')
    if (storedWidth) {
      // Clear the stored width after using it
      sessionStorage.removeItem('viewportWidth')
      return parseInt(storedWidth) < MOBILE_BREAKPOINT
    }
    
    // Fallback to current window width
    return window.innerWidth < MOBILE_BREAKPOINT
  })

  React.useEffect(() => {
    // Store viewport width before OAuth redirect
    const storeViewportWidth = () => {
      sessionStorage.setItem('viewportWidth', window.innerWidth.toString())
    }

    // Check if we're about to redirect to OAuth
    const isOAuthRedirect = window.location.href.includes('accounts.google.com')
    if (isOAuthRedirect) {
      storeViewportWidth()
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Set initial value
    onChange()

    // Add event listeners
    mql.addEventListener("change", onChange)
    window.addEventListener('resize', onChange)

    return () => {
      mql.removeEventListener("change", onChange)
      window.removeEventListener('resize', onChange)
    }
  }, [])

  return isMobile
} 



// import * as React from "react"

// const MOBILE_BREAKPOINT = 768

// export function useIsMobile() {
//   const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

//   React.useEffect(() => {
//     const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
//     const onChange = () => {
//       setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
//     }
//     mql.addEventListener("change", onChange)
//     setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
//     return () => mql.removeEventListener("change", onChange)
//   }, [])

//   return !!isMobile
// }
