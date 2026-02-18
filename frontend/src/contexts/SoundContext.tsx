'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type SoundType =
    | 'bgm'
    | 'draw'
    | 'play_card'
    | 'nope'
    | 'explode'
    | 'defuse'
    | 'win'
    | 'lose'
    | 'shuffle'
    | 'your_turn'
    | 'intro'
    | 'alarm';

interface SoundContextType {
    isMuted: boolean;
    toggleMute: () => void;
    playSound: (type: SoundType) => void;
    playBGM: () => void;
    stopBGM: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const [isMuted, setIsMuted] = useState(false);
    const [bgmAudio, setBgmAudio] = useState<HTMLAudioElement | null>(null);

    // Load mute state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('isMuted');
        if (saved) {
            setIsMuted(JSON.parse(saved));
        }

        // Auto-play workaround: Play BGM on first user interaction
        const handleInteraction = () => {
            if (!bgmAudio && !isMuted) {
                playBGM();
            }
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, [bgmAudio, isMuted]);

    // Update localStorage when mute changes
    const toggleMute = useCallback(() => {
        setIsMuted((prev) => {
            const newState = !prev;
            localStorage.setItem('isMuted', JSON.stringify(newState));
            if (newState && bgmAudio) {
                bgmAudio.pause();
            } else if (!newState && bgmAudio) {
                bgmAudio.play().catch(() => { }); // Auto-play might be blocked
            }
            return newState;
        });
    }, [bgmAudio]);

    const playSound = useCallback((type: SoundType) => {
        if (isMuted) return;

        const audio = new Audio(`/assets/sounds/${type}.mp3`);
        audio.volume = 0.5; // Default volume for SFX

        // Play and catch errors (e.g. file not found)
        audio.play().catch((err) => {
            console.warn(`Failed to play sound: ${type}`, err);
        });
    }, [isMuted]);

    const playBGM = useCallback(() => {
        if (bgmAudio) return; // Already setup

        const audio = new Audio('/assets/sounds/bgm.mp3');
        audio.loop = true;
        audio.volume = 0.3; // Lower volume for BGM
        setBgmAudio(audio);

        if (!isMuted) {
            audio.play().catch((err) => {
                console.warn('BGM auto-play blocked or file missing', err);
            });
        }
    }, [bgmAudio, isMuted]);

    const stopBGM = useCallback(() => {
        if (bgmAudio) {
            bgmAudio.pause();
            bgmAudio.currentTime = 0;
        }
    }, [bgmAudio]);

    return (
        <SoundContext.Provider value={{ isMuted, toggleMute, playSound, playBGM, stopBGM }}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSound() {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
}
