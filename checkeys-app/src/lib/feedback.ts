let audio: AudioContext | null = null

function context() {
  if (!audio) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    audio = new Ctor()
  }
  return audio
}

// O navegador só libera áudio depois de um toque: destrava no primeiro toque da sessão.
if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    () => {
      try {
        void context()?.resume()
      } catch {
        /* sem áudio */
      }
    },
    { once: true },
  )
}

/** Bipe curto e vibração quando uma leitura acontece. */
export function feedback(ok = true) {
  try {
    // O navegador só permite vibrar depois que a pessoa tocou na página.
    const ativo = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? true
    if (ativo) navigator.vibrate?.(ok ? 70 : [60, 60, 60])
  } catch {
    /* sem vibração */
  }
  try {
    const ctx = context()
    if (!ctx || ctx.state !== 'running') return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = ok ? 1046 : 330
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.17)
  } catch {
    /* sem áudio */
  }
}
