// VITE_-prefixed env vars are baked into the client bundle at build time, so
// this key is visible in the shipped JS via devtools — known limitation, not
// a bug. A server-side proxy is the real fix if this key needs genuine
// protection; tracked as a follow-up, not being done now.
import { useMemo, useState, useEffect } from 'react';
import { Camera, CheckCircle2, ImagePlus, Sparkles, UploadCloud, Download, Video, X } from 'lucide-react';

const KIRI_API_KEY = import.meta.env.VITE_KIRI_API_KEY;
const KIRI_API_BASE_URL = 'https://api.kiriengine.app/api';

function getNestedValue(payload, keys) {
  if (!payload || typeof payload !== 'object') return null;

  for (const key of keys) {
    if (payload[key] !== undefined && payload[key] !== null) {
      return payload[key];
    }
  }

  const nestedCandidates = ['data', 'result', 'response', 'output'];
  for (const nestedKey of nestedCandidates) {
    const nestedValue = payload[nestedKey];
    if (nestedValue && typeof nestedValue === 'object') {
      const nestedResult = getNestedValue(nestedValue, keys);
      if (nestedResult !== null) return nestedResult;
    }
  }

  return null;
}

function normalizeStatus(status) {
  if (!status) return '';
  const value = String(status).toLowerCase();
  if (['done', 'completed', 'complete', 'succeeded', 'success', 'finished'].includes(value)) return 'complete';
  if (['processing', 'running', 'queued', 'pending', 'in_progress', 'in-progress', 'working'].includes(value)) return 'processing';
  if (['failed', 'error', 'cancelled', 'canceled'].includes(value)) return 'failed';
  return value;
}

// Kiri's reconstruction API needs individual still images, not video, so any
// recorded/uploaded video gets sliced into frames client-side before being
// added to the photo set. Extracts a frame roughly every `intervalSeconds`.
function extractFramesFromVideo(videoFile, intervalSeconds = 0.75) {
  return new Promise((resolve, reject) => {
    const videoEl = document.createElement('video');
    videoEl.preload = 'auto';
    videoEl.muted = true;
    videoEl.playsInline = true;

    const objectUrl = URL.createObjectURL(videoFile);
    videoEl.src = objectUrl;

    const frames = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      videoEl.remove();
    };

    videoEl.onloadedmetadata = async () => {
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;

      const duration = videoEl.duration;
      if (!duration || !isFinite(duration)) {
        cleanup();
        reject(new Error('Could not read video duration.'));
        return;
      }

      const timestamps = [];
      for (let t = 0; t < duration; t += intervalSeconds) timestamps.push(t);

      const seekTo = (time) =>
        new Promise((res) => {
          const onSeeked = () => {
            videoEl.removeEventListener('seeked', onSeeked);
            res();
          };
          videoEl.addEventListener('seeked', onSeeked);
          videoEl.currentTime = time;
        });

      try {
        for (let i = 0; i < timestamps.length; i++) {
          await seekTo(timestamps[i]);
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
          if (blob) {
            frames.push(
              new File([blob], `${videoFile.name.replace(/\.[^/.]+$/, '')}-frame-${String(i).padStart(3, '0')}.jpg`, {
                type: 'image/jpeg'
              })
            );
          }
        }
        cleanup();
        resolve(frames);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    videoEl.onerror = () => {
      cleanup();
      reject(new Error('Could not load the video for frame extraction.'));
    };
  });
}

export function KiriScanner({ onScanComplete }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Ready for a fresh room capture');
  const [error, setError] = useState('');
  const [modelUrl, setModelUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExtractingFrames, setIsExtractingFrames] = useState(false);

  const previewLabel = useMemo(() => {
    if (!selectedFiles.length) return 'No photos selected yet';
    const names = selectedFiles.slice(0, 3).map((file) => file.name);
    return names.join(', ') + (selectedFiles.length > 3 ? '…' : '');
  }, [selectedFiles]);

  // Keep the status line reflecting the current photo count whenever we're
  // not mid-scan, mid-download, or mid-frame-extraction (those set their own messages).
  useEffect(() => {
    if (isProcessing || isDownloading || isExtractingFrames) return;

    if (!selectedFiles.length) {
      setStatus('Ready for a fresh room capture');
    } else {
      setStatus(`${selectedFiles.length} photo${selectedFiles.length > 1 ? 's' : ''} ready to scan`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles.length]);

  const handleFileSelection = async (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    event.target.value = ''; // allow re-selecting the same file(s) again later
    if (!incomingFiles.length) return;

    const imageFiles = incomingFiles.filter((file) => file.type.startsWith('image/'));
    const videoFiles = incomingFiles.filter((file) => file.type.startsWith('video/'));

    setError('');

    if (imageFiles.length) {
      setSelectedFiles((prev) => [...prev, ...imageFiles]);
    }

    if (videoFiles.length) {
      setIsExtractingFrames(true);
      setStatus(`Extracting frames from ${videoFiles.length} video${videoFiles.length > 1 ? 's' : ''}…`);

      try {
        for (const videoFile of videoFiles) {
          const frames = await extractFramesFromVideo(videoFile);
          setSelectedFiles((prev) => [...prev, ...frames]);
        }
      } catch (err) {
        console.error(err);
        setError('Could not extract frames from one of the videos. Try a shorter clip or a different format.');
      } finally {
        setIsExtractingFrames(false);
      }
    }
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setError('');
    setStatus('Ready for a fresh room capture');
  };

  const scanPhotos = async () => {
    if (!selectedFiles.length || selectedFiles.length < 20) {
      setError(`Please select at least 20 photos first (currently selected ${selectedFiles.length}). KIRI Engine requires 20+ images for reconstruction.`);
      return;
    }

    if (!KIRI_API_KEY) {
      setError('Missing Kiri API key. Set VITE_KIRI_API_KEY in your .env file before running the scan.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setModelUrl('');
    setStatus('Uploading photos to Kiri Engine…');

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('imagesFiles', file, file.name);
    });
    formData.append('calculateType', '1');
    formData.append('fileFormat', 'glb');

    try {
      // 1. Upload photos to start the scan
      const createResponse = await fetch(`${KIRI_API_BASE_URL}/v1/open/photo/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KIRI_API_KEY}`
        },
        body: formData
      });

      if (!createResponse.ok) {
        const text = await createResponse.text();
        throw new Error(text || 'The upload request failed.');
      }

      const createPayload = await createResponse.json();
      const jobId = getNestedValue(createPayload, ['serialize', 'id', 'job_id', 'jobId', 'task_id', 'taskId']);

      if (!jobId) {
        throw new Error('No serialize ID was returned by the API.');
      }

      setStatus('Processing 3D reconstruction…');

      // 2. Poll for status
      let attempts = 0;
      while (attempts < 40) {
        const pollResponse = await fetch(`${KIRI_API_BASE_URL}/v1/open/model/getStatus?serialize=${jobId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${KIRI_API_KEY}`
          }
        });

        if (!pollResponse.ok) {
          throw new Error('The polling request failed.');
        }

        const pollPayload = await pollResponse.json();

        // Check Kiri Engine specific status code (2 = Successful, 1 = Failed, 0 = Processing)
        const currentStatusCode = getNestedValue(pollPayload, ['status']);
        const currentStatusStr = normalizeStatus(getNestedValue(pollPayload, ['state', 'job_status', 'jobStatus']));

        const isComplete = currentStatusCode === 2 || currentStatusStr === 'complete';
        const isFailed = currentStatusCode === 1 || currentStatusStr === 'failed';

        if (isComplete) {
          // 3. Get Download URL
          const dlResponse = await fetch(`${KIRI_API_BASE_URL}/v1/open/model/download-3d-models-zipped?serialize=${jobId}`, {
             method: 'GET',
             headers: {
               Authorization: `Bearer ${KIRI_API_KEY}`
             }
          });

          if (!dlResponse.ok) {
            const text = await dlResponse.text();
            throw new Error(text || 'The request for the download URL failed.');
          }

          const dlPayload = await dlResponse.json();
          const finalModelUrl = getNestedValue(dlPayload, ['url', 'download_url', 'downloadUrl', 'model_url', 'modelUrl', 'output_url', 'outputUrl']) || getNestedValue(pollPayload, ['download_url', 'model_url', 'url']);

          if (!finalModelUrl) {
            throw new Error('The job completed but no model URL was returned.');
          }

          setModelUrl(finalModelUrl);
          onScanComplete?.(finalModelUrl);
          setStatus('Scan complete — your model is ready');
          return;
        }

        if (isFailed) {
          throw new Error('The reconstruction job failed.');
        }

        attempts += 1;
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }

      throw new Error('The model did not finish processing in time.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'The scan could not be completed.');
      setStatus('Scan failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cross-origin URLs ignore the <a download> attribute (the browser just
  // navigates/opens the file instead of saving it), so we fetch the file as
  // a blob ourselves and trigger the save from a local object URL instead.
  const downloadModel = async () => {
    if (!modelUrl) return;

    setIsDownloading(true);
    setError('');

    try {
      const response = await fetch(modelUrl);
      if (!response.ok) {
        throw new Error('Could not fetch the model file for download.');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'scanned-model.zip'; // Kiri returns a zipped bundle (glb + textures)
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error(err);
      setError('Could not download the model automatically — opening it in a new tab instead.');
      window.open(modelUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-2xl border-4 border-[#2D3436] bg-cyan-400 p-2 shadow-[0_4px_0_0_#2D3436]">
          <Camera className="w-5 h-5 text-[#2D3436]" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300">Kiri Scan</p>
          <h3 className="text-lg font-black uppercase tracking-wide">CREATE A 3D MODEL</h3>
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-4">
        Upload photos or videos of a room or object and convert them into a downloadable .glb model. You can also use your camera to snap photos or record a walkthrough directly.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-[3px] border-[#2D3436] bg-emerald-400 px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-[#2D3436] shadow-[0_6px_0_0_#2D3436] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#2D3436]">
          <UploadCloud className="w-4 h-4" />
          Choose files
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileSelection}
          />
        </label>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-[3px] border-[#2D3436] bg-cyan-300 px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-[#2D3436] shadow-[0_6px_0_0_#2D3436] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#2D3436]">
          <Camera className="w-4 h-4" />
          Take photo
          {/* capture="environment" opens the rear camera directly on mobile devices */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelection}
          />
        </label>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-[3px] border-[#2D3436] bg-violet-300 px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-[#2D3436] shadow-[0_6px_0_0_#2D3436] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#2D3436]">
          <Video className="w-4 h-4" />
          Record video
          <input
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelection}
          />
        </label>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/50 p-3 text-sm text-slate-200">
        <div className="flex items-center gap-2 text-cyan-300">
          {isProcessing || isExtractingFrames ? (
            <Sparkles className="w-4 h-4 animate-pulse" />
          ) : (
            <ImagePlus className="w-4 h-4" />
          )}
          <span className="font-semibold">{status}</span>
        </div>
        <p className="mt-2 break-words text-xs text-slate-400">{previewLabel}</p>
      </div>

      {selectedFiles.length ? (
        <div className="mt-3 max-h-40 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/40 p-2">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={clearFiles}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-300 hover:text-rose-200"
            >
              Clear all
            </button>
          </div>
          <ul className="space-y-1">
            {selectedFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-2 py-1 text-xs text-slate-300"
              >
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="shrink-0 rounded-full p-0.5 text-slate-400 hover:text-rose-300"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        onClick={scanPhotos}
        disabled={isProcessing || isExtractingFrames}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-[#2D3436] bg-cyan-400 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#2D3436] shadow-[0_6px_0_0_#2D3436] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#2D3436] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isProcessing ? (
          <>
            <Sparkles className="w-4 h-4 animate-pulse" />
            Processing...
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            Scan model
          </>
        )}
      </button>

      {modelUrl ? (
        <button
          onClick={downloadModel}
          disabled={isDownloading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-[#2D3436] bg-amber-300 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#2D3436] shadow-[0_6px_0_0_#2D3436] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#2D3436] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isDownloading ? (
            <>
              <Sparkles className="w-4 h-4 animate-pulse" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download model
            </>
          )}
        </button>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        Sends the final .glb URL back through the callback prop
      </div>
    </div>
  );
}