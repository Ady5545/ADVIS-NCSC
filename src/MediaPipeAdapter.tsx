import React, { useEffect, useRef } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { useTrackingState, NormalizedHandState, NormalizedHand } from './TrackingProvider';

export const MediaPipeAdapter: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const { setHandState } = useTrackingState();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (cameraRef.current) {
        try { cameraRef.current.stop(); } catch (e) {}
        cameraRef.current = null;
      }
      if (handsRef.current) {
        try { handsRef.current.close(); } catch (e) {}
        handsRef.current = null;
      }
      setHandState(prev => ({ ...prev, isTracking: false, hands: [] }));
      return;
    }

    setHandState(prev => ({ ...prev, isTracking: true }));

    const videoElement = document.createElement('video');
    videoElement.style.position = 'absolute';
    videoElement.style.width = '1px';
    videoElement.style.height = '1px';
    videoElement.style.opacity = '0';
    videoElement.style.pointerEvents = 'none';
    
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.autoplay = true;
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('muted', 'true');
    videoElement.setAttribute('autoplay', 'true');
    
    document.body.appendChild(videoElement);
    videoRef.current = videoElement;

    let hands: any = null;
    let camera: any = null;

    try {
      const MP_Hands = (Hands as any)?.Hands || (Hands as any)?.default || Hands;
      hands = new MP_Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.75,
        minTrackingConfidence: 0.75
      });

      hands.onResults((results: Results) => {
        const hasHands = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
        
        const normalizedHands: NormalizedHand[] = [];
        
        if (hasHands) {
          for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const classification = results.multiHandedness && results.multiHandedness[i];
            
            normalizedHands.push({
              handedness: (classification?.label === 'Right' ? 'Right' : 'Left'), // Keep mediapipe handedness as is for now
              confidence: classification?.score || 1.0,
              landmarks: landmarks.map(lm => ({ x: lm.x, y: lm.y, z: lm.z || 0 }))
            });
          }
        }

        setHandState({
          isTracking: true,
          hands: normalizedHands,
          timestamp: performance.now()
        });
      });

      handsRef.current = hands;

      const MP_Camera = (Camera as any)?.Camera || (Camera as any)?.default || Camera;
      camera = new MP_Camera(videoElement, {
        onFrame: async () => {
          if (handsRef.current && videoElement && videoElement.readyState >= 2) {
            try { await handsRef.current.send({ image: videoElement }); } catch (err) {}
          }
        },
        width: 640,
        height: 480
      });

      camera.start().catch(() => setHandState(prev => ({ ...prev, isTracking: false })));
      cameraRef.current = camera;
    } catch (err) {
      setHandState(prev => ({ ...prev, isTracking: false }));
    }

    return () => {
      if (cameraRef.current) { try { cameraRef.current.stop(); } catch (e) {} cameraRef.current = null; }
      if (handsRef.current) { try { handsRef.current.close(); } catch (e) {} handsRef.current = null; }
      if (videoElement.parentNode) { try { videoElement.parentNode.removeChild(videoElement); } catch (e) {} }
    };
  }, [enabled, setHandState]);

  return null;
};
