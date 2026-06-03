import { useRef, useCallback, useEffect } from 'react';

/** Web Audio API hook for UI sound effects. */
export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  // Bug 7 fix: Close the AudioContext when this hook unmounts.
  // Browsers allow a maximum of ~6 AudioContext instances per tab.
  // Without this, a long staff session that remounts this hook (e.g. route
  // navigation) would silently leak AudioContext instances until audio stops working.
  useEffect(() => {
    return () => {
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        void ctxRef.current.close();
        ctxRef.current = null;
      }
    };
  }, []);

  const init = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
  }, []);

  const playSwoosh = useCallback(() => {
    try {
      init();
      const ctx = ctxRef.current!;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch { /* silent fail */ }
  }, [init]);

  const playChime = useCallback(() => {
    try {
      init();
      const ctx = ctxRef.current!;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch { /* silent fail */ }
  }, [init]);

  const vibrateClick = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
  }, []);

  return { playSwoosh, playChime, vibrateClick };
}
