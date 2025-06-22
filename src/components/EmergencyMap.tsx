import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import { EmergencyReport, Responder } from '../types/emergency';
import { useEmergency } from '../contexts/EmergencyContext';
import { AlertTriangle, Heart, Flame, Droplets, Users, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface EmergencyMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  showResponders?: boolean;
  selectedReport?: string;
  onReportSelect?: (reportId: string) => void;
}

const EmergencyMap: React.FC<EmergencyMapProps> = ({
  center = [40.7128, -74.0060], // NYC default
  zoom = 12,
  height = '400px',
  showResponders = true,
  selectedReport,
  onReportSelect,
}) => {
  const { reports, responders } = useEmergency();

  const getEmergencyIcon = (type: string, severity: string) => {
    const getIconComponent = () => {
      switch (type) {
        case 'fire': return '🔥';
        case 'medical': return '🚑';
        case 'flood': return '🌊';
        case 'earthquake': return '🏗️';
        case 'accident': return '🚗';
        default: return '⚠️';
      }
    };

    const getColor = () => {
      switch (severity) {
        case 'critical': return '#dc2626';
        case 'high': return '#ea580c';
        case 'medium': return '#d97706';
        case 'low': return '#65a30d';
        default: return '#6b7280';
      }
    };

    return divIcon({
      html: `
        <div style="
          background: ${getColor()};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          ${getIconComponent()}
        </div>
      `,
      className: 'emergency-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const getResponderIcon = (role: string, isAvailable: boolean) => {
    const getColor = () => {
      if (!isAvailable) return '#6b7280';
      switch (role) {
        case 'medic': return '#dc2626';
        case 'firefighter': return '#ea580c';
        case 'police': return '#2563eb';
        case 'search_rescue': return '#7c3aed';
        default: return '#059669';
      }
    };

    const getEmoji = () => {
      switch (role) {
        case 'medic': return '👨‍⚕️';
        case 'firefighter': return '👨‍🚒';
        case 'police': return '👮';
        case 'search_rescue': return '🦺';
        default: return '🤝';
      }
    };

    return divIcon({
      html: `
        <div style="
          background: ${getColor()};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          ${!isAvailable ? 'opacity: 0.6;' : ''}
        ">
          ${getEmoji()}
        </div>
      `,
      className: 'responder-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  return (
    <div className="relative">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height, width: '100%' }}
        className="rounded-lg z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Emergency Reports */}
        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.location.lat, report.location.lng]}
            icon={getEmergencyIcon(report.type, report.severity)}
            eventHandlers={{
              click: () => onReportSelect?.(report.id),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    report.severity === 'critical' ? 'bg-red-500' :
                    report.severity === 'high' ? 'bg-orange-500' :
                    report.severity === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <span className="font-semibold text-sm capitalize">
                    {report.type.replace('_', ' ')} Emergency
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{report.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{report.timestamp.toLocaleTimeString()}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    report.status === 'active' ? 'bg-red-100 text-red-800' :
                    report.status === 'responding' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {report.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Responders */}
        {showResponders && responders.map((responder) => (
          responder.location && (
            <Marker
              key={responder.id}
              position={[responder.location.lat, responder.location.lng]}
              icon={getResponderIcon(responder.role, responder.isAvailable)}
            >
              <Popup>
                <div className="p-2 min-w-[180px]">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      responder.isAvailable ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="font-semibold text-sm">
                      {responder.name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1 capitalize">
                    {responder.role.replace('_', ' ')}
                  </p>
                  <div className="text-xs text-gray-500">
                    <p className="mb-1">
                      Status: {responder.isAvailable ? 'Available' : 'Busy'}
                    </p>
                    {responder.skills.length > 0 && (
                      <p>Skills: {responder.skills.slice(0, 2).join(', ')}</p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
};

export default EmergencyMap;