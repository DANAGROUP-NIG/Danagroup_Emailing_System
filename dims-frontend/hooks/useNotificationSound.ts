"use client";

import { useCallback, useRef } from "react";

/**
 * Plays a soft notification chime using the Web Audio API.
 * No external audio file required — generates a short tone programmatically.
 * Respects the user's inAppSounds preference stored in localStorage.
 */
export function useNotificationSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const isSoundEnabled = useCallback((): boolean => {
    try {
      const val = localStorage.getItem("dims:inAppSounds");
      // Default true if not set
      return val === null ? true : val === "true";
    } catch {
      return true;
    }
  }, []);

  /** Play a gentle two-tone chime (mail / notification sound) */
  const playNotification = useCallback(() => {
    if (!isSoundEnabled()) return;
    const ctx = getCtx();
    if (!ctx) return;

    const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
    void resume.then(() => {
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      // First tone — E5
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc1.connect(gainNode);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.3);

      // Second tone — B5 (plays slightly after)
      const gainNode2 = ctx.createGain();
      gainNode2.connect(ctx.destination);
      gainNode2.gain.setValueAtTime(0, ctx.currentTime + 0.15);
      gainNode2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.18);
      gainNode2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(987.77, ctx.currentTime + 0.15);
      osc2.connect(gainNode2);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.7);
    });
  }, [getCtx, isSoundEnabled]);

  /** Play a shorter single-tone ping (chat / minor notification) */
  const playPing = useCallback(() => {
    if (!isSoundEnabled()) return;
    const ctx = getCtx();
    if (!ctx) return;

    const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
    void resume.then(() => {
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.connect(gainNode);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    });
  }, [getCtx, isSoundEnabled]);

  return { playNotification, playPing };
}
