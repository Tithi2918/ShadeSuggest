import { useRef, useState, useCallback } from 'react';
import { useAppState } from '@state/AppState';
import { ingestImage } from '@cv/imageIngestion';

const ACCEPTED = '.jpg,.jpeg,.png,.webp';

export default function UploadPanel() {
  const { dispatch } = useAppState();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const onInputChange = (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const onAnalyse = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const result = await ingestImage(file);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    dispatch({
      type: 'UPLOAD_SUCCESS',
      payload: {
        file,
        dataUrl: result.dataUrl,
        bitmap: result.bitmap,
        width: result.width,
        height: result.height,
      },
    });
    dispatch({ type: 'ANALYSIS_START' });
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-12 flex flex-col gap-8">
      <div className="text-center">
        <h1 className="font-display text-4xl text-charcoal mb-2">Upload Your Photo</h1>
        <p className="text-muted text-sm">
          Use a well-lit, front-facing photo for the best results. JPEG, PNG, or WebP · max 10 MB.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        id="upload-dropzone"
        role="button"
        tabIndex={0}
        aria-label="Upload photo drop zone — click or drag and drop"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden
          ${dragOver ? 'border-brand bg-brand-light scale-[1.01]' : 'border-brand/30 bg-white hover:border-brand/60 hover:bg-brand-light/30'}`}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Selected photo preview"
              className="w-full h-72 object-cover"
            />
            <div className="absolute inset-0 bg-charcoal/10 flex items-end p-4">
              <span className="text-white text-xs bg-charcoal/60 rounded-full px-3 py-1 backdrop-blur-sm">
                Click to change photo
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-8">
            {/* Upload icon */}
            <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center">
              <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-charcoal text-sm font-medium">
                {dragOver ? 'Drop it here' : 'Drag & drop your photo here'}
              </p>
              <p className="text-muted text-xs mt-1">or click to browse files</p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={onInputChange}
          className="sr-only"
          aria-hidden="true"
          id="upload-file-input"
        />
      </div>

      {/* Error */}
      {error && (
        <p id="upload-error" role="alert" className="text-sm text-red-600 text-center">
          {error}
        </p>
      )}

      {/* Analyse button */}
      <button
        id="analyse-button"
        onClick={onAnalyse}
        disabled={!file || loading}
        className="w-full py-3.5 bg-brand text-white font-body text-sm rounded-full
          hover:bg-brand/90 active:scale-[0.98] transition-all duration-150
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing…' : 'Analyse My Skin Tone'}
      </button>

      <p className="text-center text-xs text-muted">
        Your photo is processed locally and never uploaded to any server.
      </p>
    </div>
  );
}
