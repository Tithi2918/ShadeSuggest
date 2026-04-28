import { useRef, useState, useCallback } from 'react';
import { useAppState } from '@state/AppState';
import { ingestImage } from '@cv/imageIngestion';

const ACCEPTED = '.jpg,.jpeg,.png,.webp';

const TIPS = [
  'Face centred and fully visible',
  'Even, natural lighting',
  'No heavy filters or makeup',
];

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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl flex flex-col gap-7">

        {/* Page heading */}
        <div className="text-center">
          <h1 className="font-display text-4xl lg:text-5xl text-charcoal mb-2 leading-tight">
            Upload Your Photo
          </h1>
          <p className="text-muted text-sm leading-relaxed">
            JPEG, PNG, or WebP · max 10 MB · processed entirely on your device
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
          className={`relative rounded-3xl cursor-pointer transition-all duration-200 overflow-hidden
            ${dragOver
              ? 'ring-2 ring-brand ring-offset-2 ring-offset-cream bg-brand-light scale-[1.01]'
              : preview
                ? 'ring-1 ring-brand-light hover:ring-brand/30'
                : 'bg-white border-2 border-dashed border-brand/20 hover:border-brand/50 hover:bg-brand-light/20'
            }`}
        >
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Selected photo preview"
                className="w-full h-80 object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent flex flex-col justify-end p-5">
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm font-medium">{file?.name}</p>
                  <span className="text-white/80 text-xs bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    Click to change
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-5 py-16 px-8">
              {/* Animated upload icon */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-200 ${
                dragOver ? 'bg-brand' : 'bg-brand-light'
              }`}>
                <svg
                  className={`w-8 h-8 transition-colors duration-200 ${dragOver ? 'text-white' : 'text-brand'}`}
                  fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-charcoal text-base font-medium mb-1">
                  {dragOver ? 'Release to upload' : 'Drag & drop your photo'}
                </p>
                <p className="text-muted text-sm">
                  or{' '}
                  <span className="text-brand font-medium underline underline-offset-2 decoration-brand/30">
                    browse to choose a file
                  </span>
                </p>
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

        {/* Photo tips */}
        {!preview && (
          <div className="flex items-start gap-3 bg-brand-light/60 rounded-2xl p-4">
            <svg className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <p className="text-xs font-medium text-charcoal mb-1.5">For best results</p>
              <ul className="flex flex-col gap-1">
                {TIPS.map((tip) => (
                  <li key={tip} className="text-xs text-muted flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-brand/40 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            id="upload-error"
            role="alert"
            className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
          >
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Analyse button */}
        <button
          id="analyse-button"
          onClick={onAnalyse}
          disabled={!file || loading}
          className="w-full py-4 bg-brand text-white font-body text-sm rounded-full
            hover:bg-brand/90 active:scale-[0.98] transition-all duration-150 shadow-sm
            disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
            flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Processing…
            </>
          ) : (
            <>
              Analyse My Skin Tone
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>

        <p className="text-center text-xs text-muted">
          🔒 Your photo is processed locally and never leaves your device.
        </p>
      </div>
    </div>
  );
}
