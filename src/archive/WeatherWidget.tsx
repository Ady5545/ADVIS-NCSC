import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow, Wind, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WeatherData {
  temperature: number;
  weathercode: number;
  windspeed: number;
  forecast?: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // We only fetch weather on mount
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`);
            const data = await res.json();
            if (data.current_weather) {
              setWeather({
                ...data.current_weather,
                forecast: data.daily
              });
            } else {
              setError('NO DATA');
            }
          } catch (err) {
            setError('API ERR');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setError('LOC DENIED');
          setLoading(false);
        }
      );
    } else {
      setError('NO GEO');
      setLoading(false);
    }
  }, []);

  const getWeatherIcon = (code: number, size: number = 32) => {
    // WMO Weather interpretation codes
    if (code === 0) return <Sun className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" size={size} />;
    if (code >= 1 && code <= 3) return <Cloud className="text-cyan-200 drop-shadow-[0_0_8px_rgba(165,243,252,0.8)]" size={size} />;
    if (code >= 51 && code <= 67) return <CloudRain className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" size={size} />;
    if (code >= 71 && code <= 77) return <CloudSnow className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" size={size} />;
    if (code >= 95 && code <= 99) return <CloudLightning className="text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]" size={size} />;
    return <Cloud className="text-cyan-200 drop-shadow-[0_0_8px_rgba(165,243,252,0.8)]" size={size} />;
  };

  const getStatusText = (code: number) => {
    if (code === 0) return 'CLEAR';
    if (code >= 1 && code <= 3) return 'CLOUDY';
    if (code >= 51 && code <= 67) return 'PRECIPITATION';
    if (code >= 71 && code <= 77) return 'SNOWFALL';
    if (code >= 95 && code <= 99) return 'STORM';
    return 'ATMOSPHERE';
  };

  return (
    <div className="flex flex-col gap-3 py-1">
      {loading ? (
        <div className="flex justify-center items-center h-16">
          <Loader2 className="animate-spin text-cyan-500/50" size={24} />
        </div>
      ) : error ? (
        <div className="flex justify-between items-center text-[10px] text-red-400 font-mono tracking-wider h-16">
          <span>ATMOSPHERICS</span>
          <span className="shadow-red-500/50 drop-shadow-md">{error}</span>
        </div>
      ) : weather ? (
        <>
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-3xl text-white font-mono tracking-wider drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                {Math.round(weather.temperature)}°
              </span>
              <span className="text-[9px] text-cyan-500 font-mono tracking-widest mt-1">
                {getStatusText(weather.weathercode)}
              </span>
            </div>
            <div className="animate-pulse">
              {getWeatherIcon(weather.weathercode, 32)}
            </div>
          </div>
          
          {weather.forecast && weather.forecast.time && (
            <div className="grid grid-cols-3 gap-2 border-t border-cyan-500/20 pt-2 mt-1">
              {[1, 2, 3].map(i => {
                const date = new Date(weather.forecast!.time[i] + 'T12:00:00');
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                const isHovered = hoveredDay === i;
                const deltaX = hoverRect ? (hoverRect.left + hoverRect.width / 2) - window.innerWidth / 2 : 0;
                const deltaY = hoverRect ? (hoverRect.top + hoverRect.height / 2) - window.innerHeight / 2 : 300;
                
                return (
                  <div 
                    key={i} 
                    className="relative flex flex-col items-center justify-center bg-cyan-950/20 rounded py-1 border border-cyan-500/10 cursor-default hover:bg-cyan-900/40 transition-colors"
                    onMouseEnter={(e) => {
                      setHoveredDay(i);
                      setHoverRect(e.currentTarget.getBoundingClientRect());
                    }}
                    onMouseLeave={() => {
                      setHoveredDay(null);
                    }}
                    onClick={(e) => {
                      if (hoveredDay === i) {
                        setHoveredDay(null);
                      } else {
                        setHoveredDay(i);
                        setHoverRect(e.currentTarget.getBoundingClientRect());
                      }
                    }}
                  >
                    <span className="text-[8px] text-cyan-500/80 font-mono tracking-wider mb-1">{dayName}</span>
                    {getWeatherIcon(weather.forecast!.weathercode[i], 16)}
                    <div className="flex gap-1 mt-1 text-[8px] font-mono">
                      <span className="text-red-400/80">{Math.round(weather.forecast!.temperature_2m_max[i])}°</span>
                      <span className="text-blue-400/80">{Math.round(weather.forecast!.temperature_2m_min[i])}°</span>
                    </div>

                    {createPortal(
                      <AnimatePresence>
                        {isHovered && (
                          <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
                            <motion.div
                              initial={{ opacity: 0, scaleY: 0.1, scaleX: 0.1, x: deltaX, y: deltaY, filter: 'blur(20px)', borderRadius: '100%' }}
                              animate={{ opacity: 1, scaleY: 1, scaleX: 1, x: 0, y: 0, filter: 'blur(0px)', borderRadius: '24px' }}
                              exit={{ opacity: 0, scaleY: 0.1, scaleX: 0.1, x: deltaX, y: deltaY, filter: 'blur(20px)', borderRadius: '100%' }}
                              transition={{ type: "spring", stiffness: 200, damping: 20, mass: 1 }}
                              className="flex flex-col items-center justify-center bg-cyan-950/90 border-2 border-cyan-400/50 p-8 text-cyan-300 font-mono w-[80%] max-w-md h-[40%] max-h-96 backdrop-blur-2xl shadow-[0_0_80px_rgba(6,182,212,0.6)] relative overflow-hidden"
                            >
                              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl opacity-80"></div>
                              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl opacity-80"></div>
                              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl opacity-80"></div>
                              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl opacity-80"></div>
                              
                              <span className="text-4xl md:text-5xl font-bold mb-4 border-b-2 border-cyan-500/50 pb-4 text-center tracking-widest drop-shadow-[0_0_10px_rgba(103,232,249,0.8)] text-cyan-50">
                                {date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
                              </span>
                              <span className="text-xl md:text-2xl text-cyan-200 mb-8 tracking-widest drop-shadow-[0_0_8px_rgba(165,243,252,0.8)]">
                                {getStatusText(weather.forecast!.weathercode[i])}
                              </span>
                              
                              {getWeatherIcon(weather.forecast!.weathercode[i], 64)}
                              
                              <div className="flex gap-12 mt-8 bg-black/50 p-4 rounded-xl border border-cyan-500/30">
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-red-400/80 mb-1">HIGH</span>
                                  <span className="text-3xl text-red-400 font-bold drop-shadow-[0_0_10px_rgba(248,113,113,0.8)]">{Math.round(weather.forecast!.temperature_2m_max[i])}°</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-blue-400/80 mb-1">LOW</span>
                                  <span className="text-3xl text-blue-400 font-bold drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]">{Math.round(weather.forecast!.temperature_2m_min[i])}°</span>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>,
                      document.body
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between text-[9px] text-cyan-300 font-mono border-t border-cyan-500/20 pt-2 tracking-wider mt-1">
            <div className="flex items-center gap-1">
              <Wind size={10} className="text-cyan-500" />
              <span>{weather.windspeed} KM/H</span>
            </div>
            <span>LOCAL ENV</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
