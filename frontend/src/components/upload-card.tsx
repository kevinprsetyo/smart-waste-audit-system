"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, ImagePlus, X, Sparkles, AlertCircle, Camera } from "lucide-react";
import Image from "next/image";
import { CameraCapture } from "./camera-capture";

interface UploadCardProps {
  onAnalyze: (file: File) => void;
  isLoading: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/bmp"];
const MAX_MB = 20;

export function UploadCard({ onAnalyze, isLoading }: UploadCardProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback((file: File) => {
    setFileError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError("Format tidak didukung. Unggah gambar JPEG, PNG, WEBP, atau BMP.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setFileError(`Ukuran file terlalu besar. Maksimal ${MAX_MB} MB.`);
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSet(file);
  }, [validateAndSet]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSet(file);
  }, [validateAndSet]);

  const clearImage = useCallback(() => {
    setPreview(null);
    setSelectedFile(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  if (showCamera) {
    return (
      <CameraCapture
        onAnalyze={onAnalyze}
        onCancel={() => setShowCamera(false)}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <ImagePlus className="text-blue-600" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Unggah Gambar</h2>
            <p className="text-xs text-slate-500 mt-0.5">JPEG, PNG, WEBP, BMP · maks. 20 MB</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Drop zone / preview */}
        {!preview ? (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => inputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
                cursor-pointer transition-all duration-200 select-none min-h-[220px]
                ${isDragging
                  ? "border-blue-500 bg-blue-50 scale-[1.01]"
                  : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40"
                }
              `}
            >
              <div className={`flex flex-col items-center gap-3 p-6 text-center transition-transform duration-200 ${isDragging ? "scale-105" : ""}`}>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-200 ${isDragging ? "bg-blue-100" : "bg-white border border-slate-200 shadow-sm"}`}>
                  <Upload className={`h-6 w-6 transition-colors duration-200 ${isDragging ? "text-blue-600" : "text-slate-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {isDragging ? "Lepaskan untuk mengunggah" : "Taruh gambar di sini"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih file</p>
                </div>
              </div>
              <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} onChange={handleChange} className="hidden" />
            </div>
            
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-xs text-slate-400 font-medium">ATAU</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>
            
            <button
              onClick={() => setShowCamera(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 border border-slate-200 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200"
            >
              <Camera size={18} />
              Ambil Foto dari Kamera
            </button>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group min-h-[220px]">
            <Image src={preview} alt="Pratinjau" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
            <button
              onClick={clearImage}
              disabled={isLoading}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed"
            >
              <X size={14} />
            </button>
            <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-1.5 shadow-sm">
              <p className="text-xs font-medium text-slate-700 truncate max-w-[200px]">{selectedFile?.name}</p>
            </div>
          </div>
        )}

        {/* Validation error */}
        {fileError && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-600 leading-relaxed">{fileError}</p>
          </div>
        )}

        {/* Analyze button */}
        <button
          onClick={() => selectedFile && onAnalyze(selectedFile)}
          disabled={!selectedFile || isLoading || !!fileError}
          className={`
            w-full flex items-center justify-center gap-2.5 rounded-xl px-5 py-3.5
            text-sm font-semibold transition-all duration-200 select-none
            ${selectedFile && !isLoading && !fileError
              ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm shadow-blue-200"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
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
    </div>
  );
}
