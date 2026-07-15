import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Sparkles } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import JSZip from 'jszip';

// TypeScript Type Declarations Matching your Schema
export interface Appliance {
  id: number | string;
  name: string;
  type: 'Air Conditioner' | 'Smart TV' | 'Lighting' | 'Water Heater' | string;
  status: 'ON' | 'OFF';
  accent: string;
  pos: {
    top: string | number;
    left: string | number;
  };
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

interface Home3DProps {
  appliances: Appliance[];
  isNightMode: boolean;
  onToggleNightMode: () => void;
}

export function Home3D({ appliances, isNightMode, onToggleNightMode }: Home3DProps) {
  const [globalModelUrl, setGlobalModelUrl] = useState<string>('/models/appartement.glb');
  const [globalCustomManager, setGlobalCustomManager] = useState<any>(null);

  return (
    <div className={`space-y-6 animate-fade-in ${isNightMode ? 'night-mode' : ''} transition-colors duration-1000 w-full mx-auto p-4`}>
      
      {/* Neo-Brutalist Header Control Panel */}
      <header className="flex justify-between items-center pt-4">
        <div className="inline-block bg-[#2D3436] border-4 border-[#2D3436] rounded-2xl px-6 py-2 shadow-[0_6px_0_0_rgba(0,0,0,0.2)]">
          <h1 className="text-2xl font-black text-white tracking-wider uppercase flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            3D Live Overview
          </h1>
        </div>

        <button
          onClick={onToggleNightMode}
          className="w-14 h-14 bg-white border-4 border-[#2D3436] rounded-full flex items-center justify-center shadow-[0_6px_0_0_#2D3436] hover:translate-y-1 hover:shadow-[0_4px_0_0_#2D3436] active:translate-y-2 active:shadow-none transition-all focus:outline-none"
        >
          {isNightMode ? <Sun className="w-6 h-6 text-[#F1C40F]" /> : <Moon className="w-6 h-6 text-[#3498DB]" />}
        </button>
      </header>

      {/* 3D Map Container Frame */}
      <div className="relative w-full h-[500px] md:h-[600px] bg-slate-900 rounded-[32px] border-4 border-[#2D3436] shadow-inner overflow-hidden flex items-center justify-center transition-colors duration-1000">
        
        {/* Dynamic Night Ambient Overlay */}
        <div
          className={`absolute inset-0 bg-[#070b19] pointer-events-none transition-opacity duration-1000 z-10 ${
            isNightMode ? 'opacity-70' : 'opacity-0'
          }`}
        ></div>

        {/* Real Interactive WebGL Room Canvas Canvas Layer */}
        <div className="absolute inset-0 z-0">
          <ThreeDViewEngine 
            appliances={appliances} 
            modelUrl={globalModelUrl}
            customManager={globalCustomManager}
            onModelChange={(url, manager) => {
              setGlobalModelUrl(url);
              setGlobalCustomManager(manager);
            }}
            isNightMode={isNightMode}
          />
        </div>
      </div>

      {/* Legend Map */}
      <div className="bg-white border-4 border-[#2D3436] rounded-2xl p-4 shadow-[0_6px_0_0_#2D3436] flex justify-center gap-6 text-sm font-black uppercase text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#2ECC71] animate-pulse shadow-[0_0_8px_rgba(46,204,113,0.7)]"></div> Active Flow
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-300"></div> Standby / Off
        </div>
      </div>
    </div>
  );
}

interface ThreeDViewEngineProps {
  appliances: Appliance[];
  modelUrl: string;
  customManager: any;
  onModelChange: (url: string, manager: any) => void;
  isNightMode: boolean;
}

function ThreeDViewEngine({ modelUrl, customManager, onModelChange, isNightMode }: ThreeDViewEngineProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('');

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

      for (let relativePath in contents.files) {
        const zipEntry = contents.files[relativePath];
        if (zipEntry.dir) continue;

        if (relativePath.endsWith('.gltf') || relativePath.endsWith('.glb')) {
          mainFile = zipEntry;
        }

        const blob = await zipEntry.async('blob');
        const virtualUrl = URL.createObjectURL(blob);
        fileMap[relativePath] = virtualUrl;

        const filename = relativePath.split('/').pop();
        if (filename) fileMap[filename] = virtualUrl;
      }

      if (!mainFile) {
        alert("Could not locate a valid internal model file extension (.glb or .gltf) within the Zip folder structure.");
        setLoadingStatus('');
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

      onModelChange(finalModelUrl, manager);
    } catch (err) {
      console.error(err);
      setLoadingStatus('Error processing structural Zip package.');
      setTimeout(() => setLoadingStatus(''), 4000);
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;
    
    // 1. Core WebGL Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isNightMode ? 0.55 : 1.2; 
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

    // 2. Interactive View Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;

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

    // 4. Custom Architectural Lighting Component Matrix
    const skyIntensity = isNightMode ? 0.1 : 0.6;
    const groundIntensity = isNightMode ? 0.05 : 0.4;
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, skyIntensity);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, groundIntensity);
    scene.add(ambientLight);
    
    const sunIntensity = isNightMode ? 0.02 : 1.3;
    const sunLight = new THREE.DirectionalLight(0xffffff, sunIntensity);
    sunLight.position.set(12, 18, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0008;
    scene.add(sunLight);

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

    // 5. Asynchronous GLTF Structural File Loader
    const activeManager = customManager || new THREE.LoadingManager();
    const loader = new GLTFLoader(activeManager);

    if (modelUrl) {
      setLoadingStatus('Compiling interior space layout...');
      loader.load(
        modelUrl,
        (gltf: any) => {
          setLoadingStatus('');
          
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          gltf.scene.position.x = -center.x;
          gltf.scene.position.y = -box.min.y;
          gltf.scene.position.z = -center.z;
          
          const wrapperGroup = new THREE.Group();
          wrapperGroup.add(gltf.scene);

          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 7 / maxDim;
          wrapperGroup.scale.multiplyScalar(scale);
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

    // 6. Animation Loop / Render Cycle
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [modelUrl, customManager, isNightMode]);

  return (
    <div className="w-full h-full relative">
      <div ref={mountRef} className="w-full h-full" />
      {loadingStatus && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
            <p className="text-sm font-black uppercase text-cyan-400">{loadingStatus}</p>
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