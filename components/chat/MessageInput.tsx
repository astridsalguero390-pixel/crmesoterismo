'use client'

import { useState, useRef } from 'react'
import { Send, Image as ImageIcon, Mic, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MessageInputProps {
    onSendMessage: (content: string, mediaUrl?: string, messageType?: string) => void
}

export default function MessageInput({ onSendMessage }: MessageInputProps) {
    const [message, setMessage] = useState('')
    const [uploading, setUploading] = useState(false)
    const [recording, setRecording] = useState(false)
    const [mediaPreview, setMediaPreview] = useState<string | null>(null)
    const [mediaType, setMediaType] = useState<string>('text')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const supabase = createClient()

    const handleSend = () => {
        if (!message.trim() && !mediaPreview) return

        onSendMessage(message || '[Media]', mediaPreview || undefined, mediaType)
        setMessage('')
        setMediaPreview(null)
        setMediaType('text')
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `media/${fileName}`

            const { data, error } = await supabase.storage
                .from('media')
                .upload(filePath, file)

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath)

            setMediaPreview(publicUrl)
            setMediaType('image')
        } catch (error) {
            console.error('Error uploading file:', error)
            alert('Error al subir archivo')
        } finally {
            setUploading(false)
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data)
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                await uploadAudio(audioBlob)
                stream.getTracks().forEach((track) => track.stop())
            }

            mediaRecorder.start()
            setRecording(true)
        } catch (error) {
            console.error('Error accessing microphone:', error)
            alert('No se pudo acceder al micrófono')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop()
            setRecording(false)
        }
    }

    const uploadAudio = async (audioBlob: Blob) => {
        setUploading(true)

        try {
            const fileName = `${Math.random()}.webm`
            const filePath = `media/${fileName}`

            const { data, error } = await supabase.storage
                .from('media')
                .upload(filePath, audioBlob)

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath)

            setMediaPreview(publicUrl)
            setMediaType('audio')
        } catch (error) {
            console.error('Error uploading audio:', error)
            alert('Error al subir audio')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="border-t border-gray-200 p-4 bg-white">
            {mediaPreview && (
                <div className="mb-3 flex items-center space-x-2 bg-purple-50 p-3 rounded-lg">
                    {mediaType === 'image' && (
                        <img src={mediaPreview} alt="Preview" className="h-20 rounded" />
                    )}
                    {mediaType === 'audio' && (
                        <audio controls className="flex-1">
                            <source src={mediaPreview} />
                        </audio>
                    )}
                    <button
                        onClick={() => {
                            setMediaPreview(null)
                            setMediaType('text')
                        }}
                        className="p-2 hover:bg-purple-100 rounded-full transition"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            )}

            <div className="flex items-end space-x-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || recording}
                    className="p-3 text-gray-600 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
                    title="Subir imagen"
                >
                    <ImageIcon className="w-5 h-5" />
                </button>

                <button
                    onClick={recording ? stopRecording : startRecording}
                    disabled={uploading}
                    className={`p-3 rounded-full transition disabled:opacity-50 ${recording
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    title={recording ? 'Detener grabación' : 'Grabar audio'}
                >
                    <Mic className="w-5 h-5" />
                </button>

                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Escribe un mensaje..."
                    disabled={uploading || recording}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:opacity-50"
                />

                <button
                    onClick={handleSend}
                    disabled={(!message.trim() && !mediaPreview) || uploading || recording}
                    className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>

            {uploading && (
                <p className="text-sm text-gray-500 mt-2">Subiendo archivo...</p>
            )}
            {recording && (
                <p className="text-sm text-red-500 mt-2 animate-pulse">● Grabando...</p>
            )}
        </div>
    )
}
