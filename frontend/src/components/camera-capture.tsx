"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import Image from "next/image";

interface CameraCaptureProps {
  onAnalyze: (file: File) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function CameraCapture({ onAnalyze, onCancel, isLoading }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const startCamera = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin.");
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      setPhotoBlob(blob);
      setPhotoUrl(URL.createObjectURL(blob));
      stopCamera();
    }, "image/jpeg", 0.9);
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setPhotoBlob(null);
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
      setPhotoUrl(null);
    }
    startCamera();
  }, [photoUrl, startCamera]);

  const handleAnalyze = useCallback(() => {
    if (photoBlob) {
      const file = new File([photoBlob], `camera-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      onAnalyze(file);
    }
  }, [photoBlob, onAnalyze]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <Camera className="text-blue-600" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Ambil Foto</h2>
            <p className="text-xs text-slate-500 mt-0.5">Ambil gambar secara langsung</p>
          </div>
        </div>
        <button
          onClick={() => { stopCamera(); onCancel(); }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {error ? (
          <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-100 rounded-xl text-center min-h-[220px]">
            <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
            <p className="text-sm text-red-700 font-medium mb-1">Akses Kamera Ditolak</p>
            <p className="text-xs text-red-600">{error}</p>
            <button onClick={startCamera} className="mt-4 px-4 py-2 text-xs font-semibold text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors">
              Coba Lagi
            </button>
          </div>
        ) : !photoUrl ? (
          <div className="relative rounded-xl overflow-hidden bg-black min-h-[300px] flex items-center justify-center">
            {isInitializing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 text-white">
                <div className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin mb-3" />
                <p className="text-xs font-medium">Membuka kamera...</p>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover max-h-[400px]"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
              <button
                onClick={capturePhoto}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Camera size={24} className="fill-current" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group min-h-[300px] flex items-center justify-center">
            <Image src={photoUrl} alt="Hasil Foto" fill className="object-contain" unoptimized />
          </div>
        )}

        {photoUrl && (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={retakePhoto}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} />
              Ambil Ulang
            </button>
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className={`
                flex-[2] flex items-center justify-center gap-2.5 rounded-xl px-5 py-3.5
                text-sm font-semibold transition-all duration-200 select-none
                ${!isLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm shadow-blue-200"
                  : "bg-blue-400 text-white cursor-not-allowed"
                }
              `}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Menganalisis…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Analisis Sampah
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
