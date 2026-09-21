import { useEffect, useRef, useState } from 'react'

function MusicButton() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [volume, setVolume] = useState(0.01)

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const toggleMusic = async () => {
    const audio = audioRef.current
    if (!audio) return

    setHasError(false)
    if (audio.paused) {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch {
        setHasError(true)
      }
      return
    }

    audio.pause()
    setIsPlaying(false)
  }

  return (
    <div className="music-control">
      <audio
        ref={audioRef}
        src="/audio/bensound-pianomoment.mp3"
        loop
        preload="none"
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
      />
      <button
        type="button"
        className="music-button"
        aria-label={isPlaying ? 'Зупинити музику' : 'Увімкнути музику'}
        aria-pressed={isPlaying}
        title={isPlaying ? 'Зупинити музику' : 'Увімкнути музику'}
        onClick={toggleMusic}
      >
        <span aria-hidden="true">{isPlaying ? 'Ⅱ' : '♫'}</span>
      </button>
      <label className="music-volume" title="Гучність музики">
        <span className="sr-only">Гучність музики</span>
        <input
          type="range"
          min="0"
          max="0.1"
          step="0.01"
          value={volume}
          aria-label="Гучність музики"
          onChange={(event) => setVolume(Number(event.target.value))}
        />
      </label>
      <span className="music-credit">
        {hasError ? 'Додай MP3 у public/audio' : 'Piano Moment · Bensound'}
      </span>
    </div>
  )
}

export default MusicButton
