import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

interface GeolocationState {
  location: [number, number] | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  supported: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const { currentLocation, setCurrentLocation } = useAppStore();
  
  const [state, setState] = useState<GeolocationState>({
    location: currentLocation,
    accuracy: null,
    loading: false,
    error: null,
    supported: 'geolocation' in navigator,
  });

  const defaultOptions: GeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes
    ...options,
  };

  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, defaultOptions);
    });
  }, [defaultOptions]);

  const requestLocation = useCallback(async () => {
    if (!state.supported) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const position = await getCurrentPosition();
      const newLocation: [number, number] = [
        position.coords.latitude,
        position.coords.longitude,
      ];

      setState(prev => ({
        ...prev,
        location: newLocation,
        accuracy: position.coords.accuracy,
        loading: false,
      }));

      setCurrentLocation(newLocation);
    } catch (error) {
      let errorMessage = 'Failed to get location';
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [state.supported, getCurrentPosition, setCurrentLocation]);

  const watchLocation = useCallback((callback?: (location: [number, number]) => void) => {
    if (!state.supported) {
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        setState(prev => ({
          ...prev,
          location: newLocation,
          accuracy: position.coords.accuracy,
          error: null,
        }));

        setCurrentLocation(newLocation);
        callback?.(newLocation);
      },
      (error) => {
        let errorMessage = 'Failed to watch location';
        
        if (error instanceof GeolocationPositionError) {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
        }));
      },
      defaultOptions
    );

    return watchId;
  }, [state.supported, defaultOptions, setCurrentLocation]);

  const stopWatching = useCallback((watchId: number) => {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const getDistanceToEvent = useCallback((eventLat: number, eventLon: number): number | null => {
    if (!state.location) return null;
    
    const [currentLat, currentLon] = state.location;
    return calculateDistance(currentLat, currentLon, eventLat, eventLon);
  }, [state.location]);

  // Automatically get location on component mount if supported
  useEffect(() => {
    if (state.supported && !currentLocation && !state.loading && !state.error) {
      // Auto-request location only if user hasn't explicitly denied it
      const hasLocationPermission = localStorage.getItem('locationPermissionRequested');
      if (!hasLocationPermission) {
        localStorage.setItem('locationPermissionRequested', 'true');
        requestLocation();
      }
    }
  }, [state.supported, currentLocation, state.loading, state.error, requestLocation]);

  // Update state when store location changes
  useEffect(() => {
    if (currentLocation !== state.location) {
      setState(prev => ({ ...prev, location: currentLocation }));
    }
  }, [currentLocation, state.location]);

  return {
    ...state,
    requestLocation,
    watchLocation,
    stopWatching,
    getDistanceToEvent,
  };
};

// Utility function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}