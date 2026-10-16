"use client";

/**
 * Bipe de fim de descanso. No iPhone o áudio só funciona depois de um toque
 * na tela, então `unlockAudio()` é chamado quando ela marca uma série.
 */
let ctx: AudioContext | null = null;

export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    /* sem áudio, tudo bem */
  }
}

export function chime() {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [0, 0.18, 0.36].forEach((t, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = [784, 988, 1175][i];
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.25, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.28);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.3);
    });
    navigator.vibrate?.([120, 60, 120]);
  } catch {
    /* ignora */
  }
}
