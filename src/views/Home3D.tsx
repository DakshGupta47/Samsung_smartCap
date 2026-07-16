import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Upload, Maximize, X } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import JSZip from 'jszip';
import type { Appliance } from '../types';

interface Home3DProps {
  appliances: Appliance[];
  onSelectAppliance?: React.Dispatch<React.SetStateAction<Appliance | null>>;
  initialModelUrl?: string;
}

export function Home3D({ appliances, onSelectAppliance, initialModelUrl = '/models/appartement.glb' }: Home3DProps) {
  const [globalModelUrl, setGlobalModelUrl] = useState<string>(initialModelUrl);
  const [globalCustomManager, setGlobalCustomManager] = useState<THREE.LoadingManager | null>(null);
  const [sceneTheme, setSceneTheme] = useState<'midnight' | 'sunrise' | 'grey'>('midnight');
  const [triggerFlyTo, setTriggerFlyTo] = useState<string | null>(null);
  const [triggerRecenter, setTriggerRecenter] = useState<number>(0);

  const sceneBackgrounds: Record<string, { container: string; floor: string; accent: string }> = {
    midnight: { container: '#000000', floor: '#1a1a1a', accent: '#ffffff' }, // Black, dark grey, white
    sunrise: { container: '#ffffff', floor: '#f2f2f2', accent: '#000000' },   // White, light grey, black
    grey: { container: '#808080', floor: '#cccccc', accent: '#333333' },     // Mid-grey, light grey, dark grey
  };

  const activeScene = sceneBackgrounds[sceneTheme];

  return (
    <div className="space-y-6 animate-fade-in transition-colors duration-1000 w-full mx-auto p-4">

      {/* Neo-Brutalist Header Control Panel */}
      <header className="flex flex-col gap-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 w-full">
          <div className="inline-block bg-white border-4 border-[#2D3436] rounded-2xl px-6 py-2 shadow-[0_6px_0_0_rgba(0,0,0,0.2)] shrink-0">
            <h1 className="text-2xl font-black text-[#2D3436] tracking-wider uppercase flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              3D Live Overview
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Custom Styled Select for Models */}
            <div className="relative">
              <select
                onChange={(e) => {
                  setGlobalModelUrl(e.target.value);
                  setGlobalCustomManager(null);
                }}
                value={globalModelUrl}
                className="appearance-none bg-purple-400 border-4 border-[#2D3436] rounded-2xl pl-4 pr-8 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#2D3436] shadow-[0_4px_0_0_#2D3436] focus:outline-none cursor-pointer"
              >
                <option value="/models/appartement.glb">Apt</option>
                <option value="/models/bathroom_interior.glb">Bath</option>
                <option value="/models/interior_4_living_room__kitchen.glb">Living</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#2D3436]">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            {/* Custom Styled Select for Themes */}
            <div className="relative">
              <select
                onChange={(e) => setSceneTheme(e.target.value as any)}
                value={sceneTheme}
                className="appearance-none bg-cyan-400 border-4 border-[#2D3436] rounded-2xl pl-4 pr-8 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#2D3436] shadow-[0_4px_0_0_#2D3436] focus:outline-none cursor-pointer"
              >
                <option value="midnight">Midnight</option>
                <option value="sunrise">Sunrise</option>
                <option value="grey">Grey</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#2D3436]">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            {/* Visible trigger for the hidden zip input */}
            <label
              htmlFor="zipUpload"
              className="cursor-pointer flex items-center gap-2 bg-white border-4 border-[#2D3436] rounded-2xl px-3 py-2 text-xs font-black uppercase tracking-[0.2em] shadow-[0_4px_0_0_#2D3436] hover:translate-y-1 hover:shadow-none transition-all"
            >
              <Upload className="w-4 h-4" />
              Custom
            </label>
            <button
              onClick={() => setTriggerRecenter(prev => prev + 1)}
              className="flex items-center gap-2 bg-emerald-400 border-4 border-[#2D3436] rounded-2xl px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#2D3436] shadow-[0_4px_0_0_#2D3436] hover:translate-y-1 hover:shadow-none transition-all"
            >
              <Maximize className="w-4 h-4" />
              Recenter
            </button>
          </div>
        </div>
      </header>

      {/* 3D Map Container Frame — expanded on X axis only to give the model more room */}
      <div
        className="relative w-[calc(100%+96px)] -mx-12 h-[500px] md:h-[600px] rounded-[32px] border-4 border-[#2D3436] shadow-inner overflow-hidden flex items-center justify-center transition-colors duration-1000"
        style={{ backgroundColor: activeScene.container }}
      >

        {/* Real Interactive WebGL Room Canvas Layer */}
        <div className="absolute inset-0 z-0">
          <ThreeDViewEngine
            appliances={appliances}
            modelUrl={globalModelUrl}
            customManager={globalCustomManager}
            onModelChange={(url, manager) => {
              setGlobalModelUrl(url);
              setGlobalCustomManager(manager);
            }}
            background={activeScene}
            onSelectAppliance={onSelectAppliance}
            triggerFlyTo={triggerFlyTo}
            triggerRecenter={triggerRecenter}
          />
        </div>
      </div>

      {/* Legend + Appliance Inspect Row */}
      <div className="bg-white border-4 border-[#2D3436] rounded-2xl p-4 shadow-[0_6px_0_0_#2D3436] flex flex-wrap items-center justify-center gap-6 text-sm font-black uppercase text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#2ECC71] animate-pulse shadow-[0_0_8px_rgba(46,204,113,0.7)]"></div> Our House
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {appliances.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                onClick={() => {
                  onSelectAppliance?.(app);
                  setTriggerFlyTo(app.id);
                }}
                title={app.name}
                className={`w-10 h-10 bg-white border-4 border-[#2D3436] rounded-xl flex items-center justify-center shadow-[0_4px_0_0_#2D3436] hover:translate-y-1 hover:shadow-none transition-all ${
                  app.status === 'ON' ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <Icon className="w-5 h-5" style={{ color: app.accent }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export interface SpatialTag {
  id: string;
  position: THREE.Vector3;
  applianceId: string | null;
}

interface ThreeDViewEngineProps {
  appliances: Appliance[];
  modelUrl: string;
  customManager: THREE.LoadingManager | null;
  onModelChange: (url: string, manager: THREE.LoadingManager | null) => void;
  background: { container: string; floor: string; accent: string };
  onSelectAppliance?: React.Dispatch<React.SetStateAction<Appliance | null>>;
  triggerFlyTo?: string | null;
  triggerRecenter?: number;
}

// Map appliance ids/names -> the light object names created in the scene.
// Adjust these keys to match however `appliances` identifies each device.
const APPLIANCE_LIGHT_MAP: Record<string, string> = {
  tv: 'SmartTVLight',
  lighting: 'LightingLight',
  ac: 'AirConditionerLight',
  airconditioner: 'AirConditionerLight',
  waterheater: 'WaterHeaterLight',
};

function ThreeDViewEngine({ appliances, modelUrl, customManager, onModelChange, background, onSelectAppliance, triggerFlyTo, triggerRecenter }: ThreeDViewEngineProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const accentLightRef = useRef<THREE.PointLight | null>(null);
  const blobUrlsRef = useRef<string[]>([]);
  const [loadingStatus, setLoadingStatus] = useState<string>('');

  const [spatialTags, setSpatialTags] = useState<SpatialTag[]>([]);
  const spatialTagsRef = useRef<SpatialTag[]>([]);
  const tagElementsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const targetFlyState = useRef<{ position: THREE.Vector3; lookAt: THREE.Vector3 } | null>(null);
  const [pendingTag, setPendingTag] = useState<SpatialTag | null>(null);

  useEffect(() => {
    spatialTagsRef.current = spatialTags;
  }, [spatialTags]);

  // Spatial tags store a raycasted world-space position from whichever model
  // was loaded when they were placed — meaningless once a different model is
  // loaded, so clear them (and any in-progress tag-placement dialog) on every
  // model switch rather than letting stale tags render against new geometry.
  useEffect(() => {
    setSpatialTags([]);
    tagElementsRef.current = {};
    setPendingTag(null);
  }, [modelUrl]);

  useEffect(() => {
    if (triggerRecenter && triggerRecenter > 0 && cameraRef.current) {
      targetFlyState.current = {
        position: new THREE.Vector3(11, 9, 11),
        lookAt: new THREE.Vector3(0, 0, 0)
      };
    }
  }, [triggerRecenter]);

  useEffect(() => {
    if (triggerFlyTo && cameraRef.current) {
      const tag = spatialTags.find(t => t.applianceId === triggerFlyTo);
      if (tag) {
        // Determine a point slightly back and up from the tag to look at it
        const offset = new THREE.Vector3(3, 3, 3);
        const newPos = tag.position.clone().add(offset);
        targetFlyState.current = { position: newPos, lookAt: tag.position };
      }
    }
  }, [triggerFlyTo, spatialTags]);

  // Unpacker engine configuration mapping zipped asset bundles
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingStatus('Unpacking Smart-Home Zip Asset Bundle...');

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);

      let mainFile: any = null;
      const fileMap: Record<string, string> = {};
      const newBlobUrls: string[] = [];

      for (let relativePath in contents.files) {
        const zipEntry = contents.files[relativePath];
        if (zipEntry.dir) continue;

        // Prefer a root-level (no folder separator) model file if multiple exist
        if (relativePath.endsWith('.gltf') || relativePath.endsWith('.glb')) {
          if (!mainFile || !relativePath.includes('/')) {
            mainFile = zipEntry;
          }
        }

        const blob = await zipEntry.async('blob');
        const virtualUrl = URL.createObjectURL(blob);
        newBlobUrls.push(virtualUrl);
        fileMap[relativePath] = virtualUrl;

        const filename = relativePath.split('/').pop();
        if (filename) fileMap[filename] = virtualUrl;
      }

      if (!mainFile) {
        alert("Could not locate a valid internal model file extension (.glb or .gltf) within the Zip folder structure.");
        setLoadingStatus('');
        newBlobUrls.forEach(url => URL.revokeObjectURL(url));
        return;
      }

      setLoadingStatus('Mapping custom asset textures...');

      const manager = new THREE.LoadingManager();
      manager.setURLModifier((url: string) => {
        const decodedUrl = decodeURIComponent(url);
        const filename = decodedUrl.split('/').pop() || '';

        if (fileMap[decodedUrl]) return fileMap[decodedUrl];
        if (fileMap[filename]) return fileMap[filename];

        const deepMatch = Object.keys(fileMap).find(key => key.endsWith(filename));
        if (deepMatch) return fileMap[deepMatch];

        return url;
      });

      const finalModelBlob = await mainFile.async('blob');
      const finalModelUrl = URL.createObjectURL(finalModelBlob);
      newBlobUrls.push(finalModelUrl);

      // Revoke the previous batch of blob URLs now that we're replacing them
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current = newBlobUrls;

      onModelChange(finalModelUrl, manager);
    } catch (err) {
      console.error(err);
      setLoadingStatus('Error processing structural Zip package.');
      setTimeout(() => setLoadingStatus(''), 4000);
    }
  };

  // Revoke any outstanding blob URLs when the component unmounts
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, []);

  // Main scene setup — rebuilds on model change
  useEffect(() => {
    if (!mountRef.current) return;

    // Cancel any in-flight fly-to/recenter camera animation — its target was
    // computed against the previous model's geometry (or spatial tags that
    // just got cleared above), so it must not carry over to the fresh camera
    // this effect is about to create for the newly-loaded model.
    targetFlyState.current = null;

    // 1. Core WebGL Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    const initialWidth = mountRef.current.clientWidth || 300;
    const initialHeight = mountRef.current.clientHeight || 500;
    renderer.setSize(initialWidth, initialHeight, false);

    const camera = new THREE.PerspectiveCamera(45, initialWidth / initialHeight, 0.1, 1000);
    camera.position.set(11, 9, 11);
    cameraRef.current = camera;

    // Double click to tag
    const onDoubleClick = (event: MouseEvent) => {
      if (!cameraRef.current || !sceneRef.current || !mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
      
      const meshes = sceneRef.current.children.filter((c: any) => c.type === 'Group' || c.type === 'Mesh');
      const intersects = raycaster.intersectObjects(meshes, true);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        setPendingTag({ id: Date.now().toString(), position: point, applianceId: null });
      }
    };
    mountRef.current.addEventListener('dblclick', onDoubleClick);

    // 2. Interactive View Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.screenSpacePanning = true; // Allows panning freely in X and Y screen space
    // Removed maxPolarAngle to allow free rotation in all directions
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controlsRef.current = controls;

    // 3. Responsive Proportional Scaler Window Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      }
    });
    resizeObserver.observe(mountRef.current);

    // Smart Mesh Point Light Emission Setup Nodes
    const livingTvLight = new THREE.PointLight(0x2ECC71, 0, 12);
    livingTvLight.position.set(-2, 1.5, -2);
    livingTvLight.name = "SmartTVLight";
    scene.add(livingTvLight);

    const mainCeilingLight = new THREE.PointLight(0xF1C40F, 0, 20);
    mainCeilingLight.position.set(0, 4.0, 0);
    mainCeilingLight.name = "LightingLight";
    scene.add(mainCeilingLight);

    const acCoolingLight = new THREE.PointLight(0x3498DB, 0, 12);
    acCoolingLight.position.set(2, 2.5, -1);
    acCoolingLight.name = "AirConditionerLight";
    scene.add(acCoolingLight);

    const waterHeaterLight = new THREE.PointLight(0xE74C3C, 0, 12);
    waterHeaterLight.position.set(-3, 1.8, 3);
    waterHeaterLight.name = "WaterHeaterLight";
    scene.add(waterHeaterLight);

    const accentGlow = new THREE.PointLight(new THREE.Color(background.accent), 8, 24);
    accentGlow.position.set(0, 4, 0);
    scene.add(accentGlow);
    accentLightRef.current = accentGlow;

    // Add global illumination so custom PBR models are visible (not pitch black)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Apply initial appliance ON/OFF state to the status lights
    applyApplianceLights(scene, appliances);

    // 5. Asynchronous GLTF Structural File Loader
    const activeManager = customManager || new THREE.LoadingManager();
    const loader = new GLTFLoader(activeManager);

    let wrapperGroup: THREE.Group | null = null;

    if (modelUrl) {
      setLoadingStatus('Compiling interior space layout...');
      loader.load(
        modelUrl,
        (gltf: any) => {
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          gltf.scene.position.x = -center.x;
          gltf.scene.position.y = -box.min.y;
          gltf.scene.position.z = -center.z;

          wrapperGroup = new THREE.Group();
          wrapperGroup.add(gltf.scene);

          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 7 / maxDim;
          wrapperGroup.scale.multiplyScalar(scale);

          // move the whole model down a bit
          wrapperGroup.position.y -= 0.6; // increase/decrease this to taste

          scene.add(wrapperGroup);
          setLoadingStatus('');
        },
        undefined,
        (error: any) => {
          console.error("Error loading 3D model:", error);
          setLoadingStatus('Error loading 3D model.');
          setTimeout(() => setLoadingStatus(''), 4000);
        }
      );
    }

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);

      if (targetFlyState.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetFlyState.current.position, 0.05);
        controlsRef.current.target.lerp(targetFlyState.current.lookAt, 0.05);
        
        if (cameraRef.current.position.distanceTo(targetFlyState.current.position) < 0.1) {
          targetFlyState.current = null;
        }
      }

      if (cameraRef.current && mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        const cam = cameraRef.current;
        
        spatialTagsRef.current.forEach(tag => {
          const el = tagElementsRef.current[tag.id];
          if (el) {
            const vector = tag.position.clone();
            vector.project(cam);
            if (vector.z > 1) {
              el.style.display = 'none';
            } else {
              el.style.display = 'flex';
              const x = (vector.x * 0.5 + 0.5) * width;
              const y = (vector.y * -0.5 + 0.5) * height;
              el.style.left = `${x}px`;
              el.style.top = `${y}px`;
            }
          }
        });
      }
    };
    animate();

    // Cleanup — dispose geometries/materials/textures before next rebuild
    return () => {
      cancelAnimationFrame(frameId);
      if (mountRef.current) mountRef.current.removeEventListener('dblclick', onDoubleClick);
      resizeObserver.disconnect();
      controls.dispose();

      scene.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m: any) => {
            Object.values(m).forEach((v: any) => {
              if (v && v.isTexture) v.dispose();
            });
            m.dispose();
          });
        }
      });

      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl, customManager]);

  // Lightweight effect: update accent light color when the theme changes,
  // without rebuilding/reloading the whole scene and model.
  useEffect(() => {
    if (accentLightRef.current) {
      accentLightRef.current.color = new THREE.Color(background.accent);
    }
  }, [background.accent]);

  // Lightweight effect: reflect appliance ON/OFF state on the status lights
  // without rebuilding the whole scene.
  useEffect(() => {
    if (sceneRef.current) {
      applyApplianceLights(sceneRef.current, appliances);
    }
  }, [appliances]);

  return (
    <div className="w-full h-full relative">
      <div ref={mountRef} className="w-full h-full" />
      {loadingStatus && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
            <p className="text-sm font-black uppercase text-cyan-400">{loadingStatus}</p>
          </div>
        </div>
      )}

      {/* Spatial Tags */}
      {spatialTags.map(tag => {
        const app = appliances.find(a => a.id === tag.applianceId);
        const Icon = app?.icon;
        const isOn = app?.status === 'ON';
        return (
          <div
            key={tag.id}
            ref={(el) => { tagElementsRef.current[tag.id] = el; }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full p-2 border-2 shadow-lg transition-colors z-10 ${isOn ? 'bg-cyan-400 border-white text-slate-900 shadow-[0_0_15px_rgba(34,211,238,0.6)] animate-pulse' : 'bg-slate-800 border-slate-500 text-slate-300'}`}
            onClick={() => { if (app && onSelectAppliance) onSelectAppliance(app); }}
            title={app?.name}
            style={{ display: 'none' }}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSpatialTags((prev) => prev.filter((t) => t.id !== tag.id));
                delete tagElementsRef.current[tag.id];
              }}
              title="Remove tag"
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border border-[#2D3436] rounded-full flex items-center justify-center text-[#2D3436]"
            >
              <X className="w-2.5 h-2.5" strokeWidth={3} />
            </button>
          </div>
        );
      })}

      {/* Pending Tag UI */}
      {pendingTag && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
          <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-[#2D3436] max-w-sm w-full mx-4">
            <h3 className="text-xl font-black uppercase text-[#2D3436] mb-4">Bind Appliance</h3>
            <p className="text-sm text-slate-500 mb-4">Select an appliance to bind to this 3D location.</p>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-4 p-2">
              {appliances.map(app => (
                <button
                  key={app.id}
                  onClick={() => {
                    setSpatialTags([...spatialTags, { ...pendingTag, applianceId: app.id }]);
                    setPendingTag(null);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 transition-colors text-left"
                >
                  {app.icon && <app.icon className="w-5 h-5 text-slate-600" />}
                  <span className="font-bold text-slate-700">{app.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setPendingTag(null)}
              className="w-full p-3 rounded-xl border-2 border-slate-300 text-slate-500 font-bold uppercase hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <input
        type="file"
        accept=".zip"
        onChange={handleZipUpload}
        className="hidden"
        id="zipUpload"
      />
    </div>
  );
}

// Turns each appliance's ON/OFF status into the matching point light's intensity.
// Update APPLIANCE_LIGHT_MAP above if your Appliance id/type values differ.
function applyApplianceLights(scene: THREE.Scene, appliances: Appliance[]) {
  appliances.forEach((app: any) => {
    const key = String(app.id ?? app.type ?? app.name ?? '').toLowerCase().replace(/\s+/g, '');
    const lightName = APPLIANCE_LIGHT_MAP[key];
    if (!lightName) return;

    const light = scene.getObjectByName(lightName) as THREE.PointLight | undefined;
    if (light) {
      light.intensity = app.status === 'ON' ? 2.5 : 0;
    }
  });
}