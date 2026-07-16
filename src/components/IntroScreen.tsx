import Spline from '@splinetool/react-spline';

interface IntroScreenProps {
  onEnter: () => void;
}

export function IntroScreen({ onEnter }: IntroScreenProps) {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black flex flex-col items-center justify-center">
      {/* Spline 3D Model Background */}
      <div className="absolute inset-0 z-0 cursor-pointer">
        <Spline 
          scene="https://prod.spline.design/MaBV5ai2obpheUFG/scene.splinecode" 
          onMouseDown={onEnter}
        />
      </div>
    </div>
  );
}
