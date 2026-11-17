export const isSecure = () => typeof window !== 'undefined' && window.isSecureContext

export const cameraSupported = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && isSecure()

export const nfcSupported = () => typeof window !== 'undefined' && 'NDEFReader' in window && isSecure()

export const storageWorks = (() => {
  try {
    localStorage.setItem('__ck', '1')
    localStorage.removeItem('__ck')
    return true
  } catch {
    return false
  }
})()
