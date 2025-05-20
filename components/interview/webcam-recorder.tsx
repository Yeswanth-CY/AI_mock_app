"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Video, StopCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WebcamRecorderProps {
  onRecordingComplete: (blob: Blob) => void
}

export function WebcamRecorder({ onRecordingComplete }: WebcamRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      stopMediaTracks()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      // Clean up video URL
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  const startCamera = async () => {
    try {
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      streamRef.current = stream
    } catch (err: any) {
      console.error("Error accessing camera:", err)
      setError(err.message || "Failed to access camera and microphone")
    }
  }

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const startRecording = () => {
    if (!streamRef.current) {
      startCamera().then(() => {
        setTimeout(() => {
          startRecording()
        }, 1000)
      })
      return
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: "video/webm",
      })

      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" })
        setRecordedBlob(blob)
        onRecordingComplete(blob)

        // Clean up previous URL if it exists
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl)
        }

        // Create a URL for the recorded video
        const newVideoUrl = URL.createObjectURL(blob)
        setVideoUrl(newVideoUrl)

        if (videoRef.current) {
          videoRef.current.srcObject = null
          videoRef.current.src = newVideoUrl
          videoRef.current.controls = true

          // Don't autoplay the recorded video to avoid AbortError
          videoRef.current.autoplay = false
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
    // Clean up previous URL if it exists
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
      setVideoUrl(null)
    }

    setRecordedBlob(null)
    setRecordingTime(0)
    startCamera()
  }

  useEffect(() => {
    startCamera()

    // Clean up function
    return () => {
      stopMediaTracks()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
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

      <Card className="overflow-hidden">
        <video
          ref={videoRef}
          autoPlay={!recordedBlob} // Only autoplay for camera preview, not for playback
          playsInline
          muted={isRecording}
          className="w-full h-auto aspect-video bg-black"
        />
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {isRecording ? (
            <span className="text-red-500 flex items-center">
              <span className="h-2 w-2 rounded-full bg-red-500 mr-2 animate-pulse" />
              Recording: {formatTime(recordingTime)}
            </span>
          ) : recordedBlob ? (
            <span>Recording complete</span>
          ) : (
            <span>Ready to record</span>
          )}
        </div>

        <div className="flex space-x-2">
          {!isRecording && !recordedBlob && (
            <Button onClick={startRecording}>
              <Video className="mr-2 h-4 w-4" />
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
    </div>
  )
}
