"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Mic, StopCircle, RefreshCw, Play, Pause } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      stopMediaTracks()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current)
      }
      // Clean up audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      // Pause audio if playing
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause()
      }
    }
  }, [audioUrl])

  const startMicrophone = async () => {
    try {
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      streamRef.current = stream
    } catch (err: any) {
      console.error("Error accessing microphone:", err)
      setError(err.message || "Failed to access microphone")
    }
  }

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const startRecording = () => {
    if (!streamRef.current) {
      startMicrophone().then(() => {
        setTimeout(() => {
          startRecording()
        }, 1000)
      })
      return
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: "audio/webm",
      })

      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        setRecordedBlob(blob)
        onRecordingComplete(blob)

        // Clean up previous URL if it exists
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl)
        }

        // Create a URL for the recorded audio
        const newAudioUrl = URL.createObjectURL(blob)
        setAudioUrl(newAudioUrl)

        if (audioRef.current) {
          audioRef.current.src = newAudioUrl
          audioRef.current.onloadedmetadata = () => {
            setDuration(audioRef.current?.duration || 0)
          }
        }
      }

      // Start recording
      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err: any) {
      console.error("Error starting recording:", err)
      setError(err.message || "Failed to start recording")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      stopMediaTracks()
    }
  }

  const resetRecording = () => {
    // Pause audio if playing
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
    }

    // Clean up previous URL if it exists
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }

    setRecordedBlob(null)
    setRecordingTime(0)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    startMicrophone()
  }

  const togglePlayback = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current)
        }
      } else {
        // Use try-catch with await to handle play() promise rejection
        try {
          await audioRef.current.play()
          setIsPlaying(true)

          // Use a timer to update current time instead of relying on timeupdate event
          if (playbackTimerRef.current) {
            clearInterval(playbackTimerRef.current)
          }

          playbackTimerRef.current = setInterval(() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime)
            }
          }, 100)
        } catch (err) {
          console.error("Error playing audio:", err)
          setIsPlaying(false)
        }
      }
    } catch (err) {
      console.error("Error toggling playback:", err)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current)
    }
  }

  useEffect(() => {
    startMicrophone()

    // Clean up function
    return () => {
      stopMediaTracks()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-6 flex flex-col items-center justify-center">
        {isRecording ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Mic className="h-8 w-8 text-red-500 animate-pulse" />
            </div>
            <p className="text-lg font-medium">Recording...</p>
            <p className="text-sm text-muted-foreground">{formatTime(recordingTime)}</p>
          </div>
        ) : recordedBlob ? (
          <div className="w-full">
            <audio ref={audioRef} className="hidden" onTimeUpdate={handleTimeUpdate} onEnded={handleAudioEnded} />
            <div className="flex items-center justify-center mb-4">
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={togglePlayback}>
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
            </div>
            <div className="space-y-2 w-full">
              <Slider value={[currentTime]} max={duration} step={0.1} onValueChange={handleSliderChange} />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mic className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium">Ready to record</p>
            <p className="text-sm text-muted-foreground">Click the button below to start</p>
          </div>
        )}
      </Card>

      <div className="flex justify-center space-x-2">
        {!isRecording && !recordedBlob && (
          <Button onClick={startRecording}>
            <Mic className="mr-2 h-4 w-4" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <Button variant="destructive" onClick={stopRecording}>
            <StopCircle className="mr-2 h-4 w-4" />
            Stop Recording
          </Button>
        )}

        {recordedBlob && (
          <Button variant="outline" onClick={resetRecording}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Record Again
          </Button>
        )}
      </div>
    </div>
  )
}
