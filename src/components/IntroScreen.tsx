import Spline from '@splinetool/react-spline';

interface IntroScreenProps {
  onEnter: () => void;
}

export function IntroScreen({ onEnter }: IntroScreenProps) {
  return (
    // Added 'touch-none' to prevent mobile swiping from scrolling the page
    <div className="relative w-screen h-screen overflow-hidden bg-black flex flex-col items-center justify-center touch-none">
      {/* Spline 3D Model Background */}
      {/* Added '[&>canvas]:!w-full [&>canvas]:!h-full' to force the Spline canvas to match the div exactly */}
      <div className="absolute inset-0 z-0 cursor-pointer [&>canvas]:!w-full [&>canvas]:!h-full">
        <Spline 
          scene="https://prod.spline.design/MaBV5ai2obpheUFG/scene.splinecode" 
          onMouseDown={onEnter}
        />
      </div>
    </div>
  );
}
