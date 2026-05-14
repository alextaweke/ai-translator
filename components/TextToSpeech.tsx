// components/TextToSpeech.tsx
"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";

interface TextToSpeechProps {
  text: string;
  language: string;
  autoPlay?: boolean;
}

export default function TextToSpeech({
  text,
  language,
  autoPlay = false,
}: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported("speechSynthesis" in window);
  }, []);

  const speak = () => {
    if (!text || !supported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Map languages to speech synthesis voices
    const voiceMap: Record<string, string> = {
      en: "en-US",
      om: "en-US", // Fallback for Oromo
      am: "am-ET", // Amharic
    };

    utterance.lang = voiceMap[language] || "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  if (!supported) return null;

  return (
    <button
      onClick={isPlaying ? stop : speak}
      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      title={isPlaying ? "Stop" : "Listen"}
    >
      {isPlaying ? (
        <VolumeX className="w-5 h-5" />
      ) : (
        <Volume2 className="w-5 h-5" />
      )}
    </button>
  );
}
