// VITE_-prefixed env vars are baked into the client bundle at build time, so
// this key is visible in the shipped JS via devtools — known limitation, not
// a bug. A server-side proxy is the real fix if this key needs genuine
// protection; tracked as a follow-up, not being done now.
import { useMemo, useState } from 'react';
import { Camera, CheckCircle2, ImagePlus, Sparkles, UploadCloud } from 'lucide-react';

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

export function KiriScanner({ onScanComplete }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Ready for a fresh room capture');
  const [error, setError] = useState('');

  const previewLabel = useMemo(() => {
    if (!selectedFiles.length) return 'No photos selected yet';
    const names = selectedFiles.slice(0, 3).map((file) => file.name);
    return names.join(', ') + (selectedFiles.length > 3 ? '…' : '');
  }, [selectedFiles]);

  const handleFileSelection = (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (!incomingFiles.length) return;

    setSelectedFiles((prev) => [...prev, ...incomingFiles]);
    setError('');
    setStatus(`${incomingFiles.length} photo${incomingFiles.length > 1 ? 's' : ''} ready to scan`);
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
          'x-api-key': KIRI_API_KEY,
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
            'x-api-key': KIRI_API_KEY,
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
             headers: { Authorization: `Bearer ${KIRI_API_KEY}` }
          });
          const dlPayload = await dlResponse.json();
          const finalModelUrl = getNestedValue(dlPayload, ['url', 'download_url', 'downloadUrl', 'model_url', 'modelUrl', 'output_url', 'outputUrl']) || getNestedValue(pollPayload, ['download_url', 'model_url', 'url']);
          
          if (!finalModelUrl) {
            throw new Error('The job completed but no model URL was returned.');
          }

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
        Upload several photos of a room or object and convert them into a downloadable .glb model.
      </p>

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-[3px] border-[#2D3436] bg-emerald-400 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#2D3436] shadow-[0_6px_0_0_#2D3436] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#2D3436]">
        <UploadCloud className="w-4 h-4" />
        Choose photos
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelection} />
      </label>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/50 p-3 text-sm text-slate-200">
        <div className="flex items-center gap-2 text-cyan-300">
          {isProcessing ? (
            <Sparkles className="w-4 h-4 animate-pulse" />
          ) : (
            <ImagePlus className="w-4 h-4" />
          )}
          <span className="font-semibold">{status}</span>
        </div>
        <p className="mt-2 break-words text-xs text-slate-400">{previewLabel}</p>
      </div>

      <button
        onClick={scanPhotos}
        disabled={isProcessing}
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
