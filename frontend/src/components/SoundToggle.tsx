'use client';

import { useSound } from '@/contexts/SoundContext';
import { useEffect } from 'react';

export default function SoundToggle() {
    const { isMuted, toggleMute, playBGM } = useSound();

    useEffect(() => {
        // Try to auto-play BGM on mount (might be blocked by browser)
        playBGM();
    }, [playBGM]);

    return (
        <button
            className="btn btn-outline btn-sm"
            onClick={toggleMute}
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
            {isMuted ? '🔇' : '🔊'}
        </button>
    );
}
