import * as THREE from 'three';

/**
 * Local-space bounds for the nebula volume.
 *
 * The parent Core group scales this mesh with the planet. Keeping the radius
 * in local units means ray/sphere intersections remain stable through that
 * transform; uCameraLocal is updated from the live mesh matrix each frame.
 */
export const NEBULA_VOLUME_RADIUS = 2.82;
export const NEBULA_VOLUME_INNER_RADIUS = 1.80;

/**
 * A bounded, front-to-back volumetric cloud field for ADVIS Core.
 *
 * The sphere is only a ray-march proxy. Cloud density is evaluated inside the
 * fragment shader, so no lumpy/displaced geometry defines the silhouette.
 */
export function createNebulaVolumeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uVoice: { value: 0 },
      uOpacity: { value: 1 },
      uRadius: { value: NEBULA_VOLUME_RADIUS },
      uInnerRadius: { value: NEBULA_VOLUME_INNER_RADIUS },
      uCameraLocal: { value: new THREE.Vector3(0, 0, 15) },
      // HologramCore lowers this modestly on high-DPI canvases.
      uSteps: { value: 22 },
    },
    vertexShader: `
      varying vec3 vLocalPosition;

      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uTime;
      uniform float uActivity;
      uniform float uVoice;
      uniform float uOpacity;
      uniform float uRadius;
      uniform float uInnerRadius;
      uniform float uSteps;
      uniform vec3 uCameraLocal;
      varying vec3 vLocalPosition;

      float hash31(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
        float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

        float z0 = mix(
          mix(n000, n100, f.x),
          mix(n010, n110, f.x),
          f.y
        );
        float z1 = mix(
          mix(n001, n101, f.x),
          mix(n011, n111, f.x),
          f.y
        );
        return mix(z0, z1, f.z);
      }

      void main() {
        vec3 rayOrigin = uCameraLocal;
        vec3 rayDirection = normalize(vLocalPosition - rayOrigin);

        // Intersect the view ray with the volume's spherical bounds.
        float b = dot(rayOrigin, rayDirection);
        float c = dot(rayOrigin, rayOrigin) - uRadius * uRadius;
        float discriminant = b * b - c;
        if (discriminant <= 0.0) discard;

        float root = sqrt(discriminant);
        float tEnter = max(-b - root, 0.0);
        float tExit = -b + root;
        if (tExit <= tEnter) discard;

        // Clip the integration at the near surface of the planet. That keeps
        // far-side gas from being composited across the visible planet disc.
        float closestT = -dot(rayOrigin, rayDirection);
        vec3 closestPoint = rayOrigin + rayDirection * closestT;
        float impactSquared = dot(closestPoint, closestPoint);
        float innerSquared = uInnerRadius * uInnerRadius;
        if (impactSquared < innerSquared && closestT > tEnter) {
          float innerHalfChord = sqrt(max(0.0, innerSquared - impactSquared));
          float nearPlanet = closestT - innerHalfChord;
          if (nearPlanet > tEnter) {
            tExit = min(tExit, nearPlanet);
          }
        }

        float segmentLength = tExit - tEnter;
        if (segmentLength <= 0.001) discard;

        float steps = clamp(uSteps, 8.0, 24.0);
        float stepLength = segmentLength / steps;
        float transmittance = 1.0;
        vec3 accumulatedColor = vec3(0.0);
        vec3 drift = vec3(uTime * 0.035, -uTime * 0.024, uTime * 0.029)
          * (0.78 + uActivity * 0.12 + uVoice * 0.08);

        for (int i = 0; i < 24; i++) {
          if (float(i) >= steps || transmittance < 0.035) break;

          float t = tEnter + (float(i) + 0.5) * stepLength;
          vec3 p = rayOrigin + rayDirection * t;
          float radialDistance = length(p);
          if (radialDistance < uInnerRadius || radialDistance >= uRadius) continue;

          // The slowly curling warp keeps the density field from looking like
          // concentric shells; a second scale supplies fine vapor structure.
          vec3 warp = vec3(
            sin(p.y * 1.7 + uTime * 0.11),
            sin(p.z * 1.9 - uTime * 0.09),
            cos(p.x * 1.6 + uTime * 0.08)
          ) * 0.22;

          float broad = noise3((p + warp) * 2.20 + drift);
          float detail = noise3((p + warp * 1.65) * 4.65
            + vec3(3.1, -2.7, 6.4) - drift * 1.35);
          float filament = pow(max(0.0, 1.0 - abs(sin(
            (broad * 0.92 + detail * 0.43 + p.y * 0.14) * 7.2 + p.x * 1.45
          ))), 4.0);

          float cloudField = broad * 0.66 + detail * 0.34 + filament * 0.045;
          float cloudDensity = pow(smoothstep(0.455, 0.705, cloudField), 1.15);

          // Fade both boundaries softly; density is broken up by the field,
          // leaving dark negative space instead of a uniformly filled sphere.
          float innerFade = smoothstep(uInnerRadius + 0.035, uInnerRadius + 0.36, radialDistance);
          float outerFade = 1.0 - smoothstep(uRadius - 0.43, uRadius - 0.055, radialDistance);
          float shell = innerFade * outerFade;
          float density = cloudDensity * shell;
          density *= 0.78 + uActivity * 0.12 + uVoice * 0.08;
          if (density < 0.012) continue;

          float stepAlpha = 1.0 - exp(-density * stepLength * 0.34);
          stepAlpha *= clamp(uOpacity, 0.0, 1.0);

          float roseMix = smoothstep(0.37, 0.70, broad * 0.54 + detail * 0.46 + p.y * 0.09);
          float cyanMask = smoothstep(0.62, 0.82, detail + broad * 0.18)
            * (1.0 - roseMix) * 0.70;
          vec3 gasColor = mix(vec3(0.075, 0.10, 0.42), vec3(0.98, 0.055, 0.34), roseMix);
          gasColor = mix(gasColor, vec3(0.10, 0.58, 1.0), cyanMask);

          float keyLight = 0.58 + 0.42 * max(
            dot(normalize(p), normalize(vec3(-0.42, 0.30, 0.85))),
            0.0
          );
          float filamentLight = 1.0 + filament * 0.72 + uVoice * 0.10 + uActivity * 0.06;
          gasColor *= keyLight * filamentLight;

          accumulatedColor += transmittance * gasColor * stepAlpha;
          transmittance *= (1.0 - stepAlpha);
        }

        float alpha = 1.0 - transmittance;
        if (alpha < 0.008) discard;

        // Normal alpha blending expects un-premultiplied output colour.
        gl_FragColor = vec4(accumulatedColor / max(alpha, 0.0001), alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
    toneMapped: false,
  });
}
