import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Zap, Eye, Wind, Droplets, Gauge, AlertTriangle } from 'lucide-react';
import { weatherService, WeatherData } from '../services/weatherService';
import { motion, AnimatePresence } from 'framer-motion';

interface WeatherWidgetProps {
  location: { lat: number; lng: number };
  className?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ location, className = '' }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeather();
  }, [location.lat, location.lng]);

  const loadWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await weatherService.getWeatherForLocation(location.lat, location.lng);
      setWeather(data);
    } catch (err) {
      setError('Failed to load weather data');
      console.error('Weather loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear': return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'clouds': return <Cloud className="h-6 w-6 text-gray-500" />;
      case 'rain': return <CloudRain className="h-6 w-6 text-blue-500" />;
      case 'snow': return <CloudSnow className="h-6 w-6 text-blue-300" />;
      case 'thunderstorm': return <Zap className="h-6 w-6 text-purple-500" />;
      default: return <Cloud className="h-6 w-6 text-gray-500" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'extreme': return 'bg-red-100 text-red-800 border-red-200';
      case 'severe': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-20"></div>
          </div>
          <div className="mt-2 h-8 bg-gray-300 rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={`bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 ${className}`}>
        <div className="text-center text-gray-500">
          <Cloud className="h-6 w-6 mx-auto mb-1 opacity-50" />
          <p className="text-xs">Weather unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200/50 overflow-hidden ${className}`}
    >
      {/* Weather Alerts */}
      <AnimatePresence>
        {weather.alerts && weather.alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-3 border-b ${getAlertColor(weather.alerts[0].severity)}`}
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{weather.alerts[0].title}</p>
                <p className="text-xs opacity-75 truncate">{weather.alerts[0].description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4">
        {/* Main Weather */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getWeatherIcon(weather.condition)}
            <div>
              <p className="text-2xl font-bold text-gray-900">{weather.temperature}°C</p>
              <p className="text-xs text-gray-600 capitalize">{weather.description}</p>
            </div>
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Droplets className="h-3 w-3 text-blue-500" />
            <span className="text-gray-600">Humidity</span>
            <span className="font-medium text-gray-900">{weather.humidity}%</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Wind className="h-3 w-3 text-gray-500" />
            <span className="text-gray-600">Wind</span>
            <span className="font-medium text-gray-900">{weather.windSpeed} m/s</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Eye className="h-3 w-3 text-purple-500" />
            <span className="text-gray-600">Visibility</span>
            <span className="font-medium text-gray-900">{weather.visibility} km</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Gauge className="h-3 w-3 text-orange-500" />
            <span className="text-gray-600">Pressure</span>
            <span className="font-medium text-gray-900">{weather.pressure} hPa</span>
          </div>
        </div>

        {/* Emergency Context */}
        {(weather.condition === 'Rain' || weather.condition === 'Thunderstorm' || weather.windSpeed > 10) && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Emergency Impact:</strong> Weather conditions may affect response times and safety protocols.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WeatherWidget;