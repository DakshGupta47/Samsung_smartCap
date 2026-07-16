import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Moon, Sun } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import JSZip from 'jszip';
import type { Appliance } from '../types';

interface Home3DProps {
  appliances: Appliance[];
  isNightMode: boolean;
  onToggleNightMode: () => void;
  onSelectAppliance?: React.Dispatch<React.SetStateAction<Appliance | null>>;
}

export function Home3D({ appliances, isNightMode, onToggleNightMode, onSelectAppliance }: Home3DProps) {
  const [globalModelUrl, setGlobalModelUrl] = useState<string>('/models/appartement.glb');
  const [globalCustomManager, setGlobalCustomManager] = useState<any>(null);
  const [sceneTheme, setSceneTheme] = useState<'midnight' | 'sunrise' | 'grey'>('midnight');

  const sceneBackgrounds: Record<string, { container: string; floor: string; accent: string }> = {
   midnight: { container: '#000000', floor: '#1a1a1a', accent: '#ffffff' }, // Black, dark grey, white
  sunrise: { container: '#ffffff', floor: '#f2f2f2', accent: '#000000' },   // White, light grey, black
  grey: { container: '#808080', floor: '#cccccc', accent: '#333333' },     // Mid-grey, light grey, dark grey
  };

  const activeScene = sceneBackgrounds[sceneTheme];

  return (
    <div className={`space-y-6 animate-fade-in ${isNightMode ? 'night-mode' : ''} transition-colors duration-1000 w-full mx-auto p-4`}>
      
      {/* Neo-Brutalist Header Control Panel */}
      <header className="flex flex-col gap-3 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="inline-block bg-white border-4 border-[#2D3436] rounded-2xl px-6 py-2 shadow-[0_6px_0_0_rgba(0,0,0,0.2)]">
          <h1 className="text-2xl font-black text-[#2D3436] tracking-wider uppercase flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            3D Live Overview
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['midnight', 'sunrise', 'grey'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => setSceneTheme(theme)}
              className={`rounded-2xl border-4 border-[#2D3436] px-3 py-2 text-xs font-black uppercase tracking-[0.2em] shadow-[0_4px_0_0_#2D3436] transition-all ${
                sceneTheme === theme ? 'bg-cyan-400 text-[#2D3436]' : 'bg-white text-[#2D3436]'
              }`}
            >
              {theme === 'midnight' ? 'Midnight' : theme === 'sunrise' ? 'sunrise' : 'grey'}
            </button>
          ))}
          <button
            onClick={onToggleNightMode}
            className="w-11 h-11 bg-white border-4 border-[#2D3436] rounded-full flex items-center justify-center shadow-[0_4px_0_0_#2D3436] hover:translate-y-1 hover:shadow-none transition-all"
          >
            {isNightMode ? <Sun className="w-5 h-5 text-[#F1C40F]" /> : <Moon className="w-5 h-5 text-[#3498DB]" />}
          </button>
        </div>
      </header>

      {/* 3D Map Container Frame */}
      <div
        className="relative w-full h-[500px] md:h-[600px] rounded-[32px] border-4 border-[#2D3436] shadow-inner overflow-hidden flex items-center justify-center transition-colors duration-1000"
        style={{ backgroundColor: activeScene.container }}
      >
        
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
            background={activeScene}
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
                onClick={() => onSelectAppliance?.(app)}
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

interface ThreeDViewEngineProps {
  appliances: Appliance[];
  modelUrl: string;
  customManager: any;
  onModelChange: (url: string, manager: any) => void;
  background: { container: string; floor: string; accent: string };
}

function ThreeDViewEngine({ modelUrl, customManager, onModelChange, background }: ThreeDViewEngineProps) {
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
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [modelUrl, customManager]);

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