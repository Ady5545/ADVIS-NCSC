import React, { useEffect, useRef } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { useTrackingState, NormalizedHand } from './TrackingProvider';

export const MediaPipeAdapter: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const { setHandState } = useTrackingState();
  const handsRef = useRef<Hands | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
        streamRef.current = null;
      }
      if (handsRef.current) {
        try { handsRef.current.close(); } catch (e) {}
        handsRef.current = null;
      }
      setHandState(prev => ({ ...prev, isTracking: false, hands: [] }));
      return;
    }

    let isActive = true;
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

    const initTracking = async () => {
      // 1. Initialize MediaPipe Hands
      try {
        const MP_Hands = (Hands as any)?.Hands || (Hands as any)?.default || Hands;
        const hands = new MP_Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.75,
          minTrackingConfidence: 0.75
        });

        hands.onResults((results: Results) => {
          if (!isActive) return;
          const hasHands = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
          const normalizedHands: NormalizedHand[] = [];
          
          if (hasHands) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
              const landmarks = results.multiHandLandmarks[i];
              const classification = results.multiHandedness && results.multiHandedness[i];
              
              normalizedHands.push({
                handedness: (classification?.label === 'Right' ? 'Right' : 'Left'),
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
      } catch (handsErr) {
        console.warn('[MediaPipeAdapter] Hands model initialization error:', handsErr);
        if (isActive) {
          setHandState(prev => ({ ...prev, isTracking: false }));
        }
        return;
      }

      // 2. Safe camera feed acquisition without throwing alerts or unhandled rejections
      if (!navigator?.mediaDevices?.getUserMedia) {
        console.warn('[MediaPipeAdapter] getUserMedia not available in this context');
        if (isActive) {
          setHandState(prev => ({ ...prev, isTracking: false, hands: [] }));
          window.dispatchEvent(new CustomEvent('advis-camera-permission-denied', {
            detail: { message: 'Camera access is not supported in this browser context.' }
          }));
        }
        return;
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });
      } catch (err: any) {
        // Gracefully catch Permission Denied (NotAllowedError) or Device Unavailable
        const isPermissionDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
        const msg = isPermissionDenied
          ? 'Camera permission denied by user or browser.'
          : (err?.message || 'Unable to access camera.');
        console.warn('[MediaPipeAdapter] Camera acquisition notice:', msg);

        if (isActive) {
          setHandState(prev => ({ ...prev, isTracking: false, hands: [] }));
          window.dispatchEvent(new CustomEvent('advis-camera-permission-denied', {
            detail: { message: msg, name: err?.name }
          }));
        }
        return;
      }

      if (!isActive) {
        if (stream) {
          stream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
        }
        return;
      }

      streamRef.current = stream;
      videoElement.srcObject = stream;

      try {
        await videoElement.play();
      } catch (playErr) {
        console.warn('[MediaPipeAdapter] Video playback delayed or blocked:', playErr);
      }

      // 3. Robust non-blocking frame processor
      let isProcessing = false;
      let lastTime = -1;

      const loop = async () => {
        if (!isActive) return;

        if (
          handsRef.current &&
          videoElement &&
          !videoElement.paused &&
          videoElement.readyState >= 2 &&
          videoElement.currentTime !== lastTime &&
          !isProcessing
        ) {
          lastTime = videoElement.currentTime;
          isProcessing = true;
          try {
            await handsRef.current.send({ image: videoElement });
          } catch (sendErr) {
            // Drop individual frame errors gracefully
          } finally {
            isProcessing = false;
          }
        }

        if (isActive) {
          animFrameRef.current = requestAnimationFrame(loop);
        }
      };

      animFrameRef.current = requestAnimationFrame(loop);
    };

    initTracking();

    return () => {
      isActive = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
        streamRef.current = null;
      }
      if (handsRef.current) {
        try { handsRef.current.close(); } catch (e) {}
        handsRef.current = null;
      }
      if (videoElement.parentNode) {
        try { videoElement.parentNode.removeChild(videoElement); } catch (e) {}
      }
      setHandState(prev => ({ ...prev, isTracking: false, hands: [] }));
    };
  }, [enabled, setHandState]);

  return null;
};
