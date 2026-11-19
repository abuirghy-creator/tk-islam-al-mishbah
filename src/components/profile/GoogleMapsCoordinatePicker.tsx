import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  Circle,
  InfoWindow,
  useMap,
  useMapsLibrary,
  useApiLoadingStatus,
  APILoadingStatus,
  useAdvancedMarkerRef,
  type MapMouseEvent
} from '@vis.gl/react-google-maps';
import {
  Search,
  MapPin,
  Navigation,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_LIBRARIES = ['places', 'marker'];

interface GoogleMapsCoordinatePickerProps {
  lat: number;
  lng: number;
  radiusMeters: number;
  locationName?: string;
  canEdit: boolean;
  onCoordinatesChange: (newLat: number, newLng: number, newLocationName?: string) => void;
  onApplyAddress?: (newAddress: string) => void;
}

const isQuotaError = (err: unknown): boolean => {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('429') ||
    msg.includes('QuotaExceeded')
  );
};

interface SelectedPlaceInfo {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface InnerPickerProps extends GoogleMapsCoordinatePickerProps {
  hasLoadError?: boolean;
  onRetryLoad?: () => void;
}

const MapCoordinatePickerInner: React.FC<InnerPickerProps> = ({
  lat,
  lng,
  radiusMeters,
  locationName,
  canEdit,
  onCoordinatesChange,
  onApplyAddress,
  hasLoadError,
  onRetryLoad
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const apiStatus = useApiLoadingStatus();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [textResults, setTextResults] = useState<SelectedPlaceInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlaceInfo | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const [markerRef, marker] = useAdvancedMarkerRef();
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Dispatch quota warning if Google Maps fails to authenticate/load due to quota
  useEffect(() => {
    if (apiStatus === APILoadingStatus.AUTH_FAILURE) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  }, [apiStatus]);

  // Keep map centered when coordinates change externally (e.g., GPS button or manual input)
  useEffect(() => {
    if (!map) return;
    const currentCenter = map.getCenter();
    if (!currentCenter) {
      map.setCenter({ lat, lng });
      return;
    }
    const diffLat = Math.abs(currentCenter.lat() - lat);
    const diffLng = Math.abs(currentCenter.lng() - lng);
    if (diffLat > 0.0001 || diffLng > 0.0001) {
      map.panTo({ lat, lng });
    }
  }, [map, lat, lng]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced Places API (New) Autocomplete Suggestions
  useEffect(() => {
    if (!placesLib || !canEdit) return;
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchError(null);
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
        const { suggestions: fetched } =
          await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: trimmed,
            sessionToken: sessionTokenRef.current,
            includedRegionCodes: ['id'],
            language: 'id'
          });
        setSuggestions(fetched || []);
        setTextResults([]);
        setShowDropdown(true);
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          setSearchError('Kuota pencarian Google Maps tercapai.');
        }
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [placesLib, searchQuery, canEdit]);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
    setSuggestions([]);
  }, []);

  const applyPlaceSelection = useCallback(
    (
      placeLat: number,
      placeLng: number,
      displayName: string,
      formattedAddress: string,
      viewport?: google.maps.LatLngBounds | null
    ) => {
      onCoordinatesChange(placeLat, placeLng, displayName);
      setSelectedPlace({
        name: displayName,
        address: formattedAddress,
        lat: placeLat,
        lng: placeLng
      });
      setIsInfoOpen(true);
      setShowDropdown(false);

      if (map) {
        if (viewport) {
          map.fitBounds(viewport);
        } else {
          map.panTo({ lat: placeLat, lng: placeLng });
          map.setZoom(17);
        }
      }
    },
    [map, onCoordinatesChange]
  );

  // Handle clicking an autocomplete suggestion
  const handleSelectSuggestion = async (
    suggestion: google.maps.places.AutocompleteSuggestion
  ) => {
    if (!placesLib || !suggestion.placePrediction) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'viewport']
      });

      if (place.location) {
        const placeLat = place.location.lat();
        const placeLng = place.location.lng();
        const displayName =
          place.displayName || suggestion.placePrediction.text.text || 'Lokasi Terpilih';
        const formattedAddress = place.formattedAddress || '';

        setSearchQuery(displayName);
        applyPlaceSelection(placeLat, placeLng, displayName, formattedAddress, place.viewport);
      } else {
        setSearchError('Lokasi yang dipilih tidak memiliki titik koordinat.');
      }
      resetSession();
    } catch (err) {
      if (isQuotaError(err)) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        setSearchError('Kuota Google Maps API tercapai.');
      } else {
        setSearchError('Gagal memuat detail lokasi dari Google Maps.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handle explicit search by place name (Enter or button click)
  const handleTextSearch = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed || !placesLib || !canEdit) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const { places } = await placesLib.Place.searchByText({
        textQuery: trimmed,
        fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
        language: 'id',
        region: 'ID',
        maxResultCount: 5
      });

      if (!places || places.length === 0) {
        setTextResults([]);
        setSearchError(`Tempat "${trimmed}" tidak ditemukan di Google Maps.`);
        return;
      }

      const validPlaces: SelectedPlaceInfo[] = [];
      for (const p of places) {
        if (p.location) {
          validPlaces.push({
            name: p.displayName || trimmed,
            address: p.formattedAddress || '',
            lat: p.location.lat(),
            lng: p.location.lng()
          });
        }
      }

      if (validPlaces.length === 0) {
        setSearchError('Hasil pencarian tidak memiliki koordinat geografis.');
        return;
      }

      // Immediately jump to the top matching place and keep list available
      const top = validPlaces[0];
      const topRaw = places[0];
      applyPlaceSelection(top.lat, top.lng, top.name, top.address, topRaw?.viewport);
      setTextResults(validPlaces);
      if (validPlaces.length > 1) {
        setShowDropdown(true);
      }
      resetSession();
    } catch (err) {
      if (isQuotaError(err)) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        setSearchError('Kuota pencarian Google Maps tercapai.');
      } else {
        setSearchError('Terjadi kendala saat mencari lokasi di Google Maps.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handle clicking directly on the map to move pin
  const handleMapClick = (e: MapMouseEvent) => {
    if (!canEdit) return;
    const clickedLatLng = e.detail.latLng;
    if (!clickedLatLng) return;

    onCoordinatesChange(clickedLatLng.lat, clickedLatLng.lng);
    setSelectedPlace({
      name: 'Titik Pin Pilihan Manual',
      address: `${clickedLatLng.lat.toFixed(6)}, ${clickedLatLng.lng.toFixed(6)}`,
      lat: clickedLatLng.lat,
      lng: clickedLatLng.lng
    });
    setIsInfoOpen(true);
  };

  // Handle dragging the AdvancedMarker
  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!canEdit || !e.latLng) return;
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();

    onCoordinatesChange(newLat, newLng);
    setSelectedPlace({
      name: 'Titik Pin Digunakan (Geser Peta)',
      address: `${newLat.toFixed(6)}, ${newLng.toFixed(6)}`,
      lat: newLat,
      lng: newLng
    });
    setIsInfoOpen(true);
  };

  if (
    hasLoadError ||
    apiStatus === APILoadingStatus.FAILED ||
    apiStatus === APILoadingStatus.AUTH_FAILURE
  ) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Peta Google Maps tidak dapat dimuat saat ini.</div>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
              Kemungkinan koneksi internet atau ekstensi browser memblokir skrip peta. Anda tetap dapat mengubah titik koordinat Latitude dan Longitude secara manual di kolom bawah atau menggunakan tombol GPS perangkat.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onRetryLoad && (
            <button
              type="button"
              onClick={onRetryLoad}
              className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang Peta</span>
            </button>
          )}
          <a
            href={`https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka di Maps</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Place Name Search Bar */}
      <div ref={searchContainerRef} className="relative">
        <label className="text-[11px] font-bold text-emerald-950 block mb-1.5">
          Cari Nama Tempat / Sekolah / Masjid di Google Maps:
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              disabled={!canEdit}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchError(null);
              }}
              onFocus={() => {
                if (suggestions.length > 0 || textResults.length > 0) {
                  setShowDropdown(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleTextSearch();
                }
              }}
              placeholder="Contoh: TK Islam Al Mishbah Jakarta, Masjid Agung, Monas..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-emerald-600 shadow-2xs disabled:bg-slate-100"
            />
            {searchQuery && canEdit && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                  setTextResults([]);
                  setSearchError(null);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => void handleTextSearch()}
            disabled={!canEdit || isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
          >
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Cari Tempat</span>
          </button>
        </div>

        {/* Autocomplete & Text Search Dropdown Results */}
        {showDropdown && (suggestions.length > 0 || textResults.length > 0) && (
          <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-emerald-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
            {suggestions.map((suggestion, idx) => {
              const main =
                suggestion.placePrediction?.mainText?.text ||
                suggestion.placePrediction?.text.text ||
                'Lokasi';
              const secondary = suggestion.placePrediction?.secondaryText?.text || '';
              return (
                <button
                  key={`sug-${idx}`}
                  type="button"
                  onClick={() => void handleSelectSuggestion(suggestion)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 text-xs truncate">{main}</div>
                    {secondary && (
                      <div className="text-[11px] text-slate-500 truncate">{secondary}</div>
                    )}
                  </div>
                </button>
              );
            })}

            {textResults.map((place, idx) => (
              <button
                key={`txt-${idx}`}
                type="button"
                onClick={() => {
                  setSearchQuery(place.name);
                  applyPlaceSelection(place.lat, place.lng, place.name, place.address, null);
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 flex items-start gap-2.5 transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 text-xs truncate">{place.name}</div>
                  {place.address && (
                    <div className="text-[11px] text-slate-500 truncate">{place.address}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {searchError && (
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{searchError}</span>
          </p>
        )}
      </div>

      {/* Selected Google Place Banner (optional quick-apply address) */}
      {selectedPlace && (
        <div className="p-2.5 bg-white border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
          <div className="flex items-start gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="font-bold text-slate-800 truncate">{selectedPlace.name}</div>
              <div className="text-slate-500 truncate">{selectedPlace.address}</div>
            </div>
          </div>
          {canEdit && onApplyAddress && selectedPlace.address && !selectedPlace.address.startsWith('-') && (
            <button
              type="button"
              onClick={() => onApplyAddress(selectedPlace.address)}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[10px] shrink-0 cursor-pointer"
            >
              Salin ke Alamat Sekolah
            </button>
          )}
        </div>
      )}

      {/* Interactive Google Map Canvas (explicit height container per CF2) */}
      <div className="relative w-full h-[320px] sm:h-[360px] rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-inner bg-slate-100">
        <GoogleMap
          defaultCenter={{ lat, lng }}
          defaultZoom={16}
          mapId="DEMO_MAP_ID"
          gestureHandling="greedy"
          streetViewControl={false}
          mapTypeControl={true}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          onClick={handleMapClick}
          style={{ width: '100%', height: '100%' }}
        >
          <AdvancedMarker
            ref={markerRef}
            position={{ lat, lng }}
            draggable={canEdit}
            clickable={true}
            title={locationName || 'Titik Pusat Sekolah'}
            onClick={() => setIsInfoOpen(true)}
            onDragEnd={handleMarkerDragEnd}
          >
            <Pin
              background="#047857"
              borderColor="#064e3b"
              glyphColor="#ffffff"
            />
          </AdvancedMarker>

          {isInfoOpen && marker && (
            <InfoWindow
              anchor={marker}
              onCloseClick={() => setIsInfoOpen(false)}
              maxWidth={240}
            >
              <div className="text-xs space-y-1 p-0.5">
                <div className="font-extrabold text-emerald-900">
                  {selectedPlace?.name || locationName || 'Titik Pusat Sekolah'}
                </div>
                {selectedPlace?.address && (
                  <div className="text-[11px] text-slate-600 leading-snug">
                    {selectedPlace.address}
                  </div>
                )}
                <div className="text-[10px] font-mono text-emerald-700 pt-0.5">
                  {lat.toFixed(6)}, {lng.toFixed(6)} • Radius {radiusMeters}m
                </div>
              </div>
            </InfoWindow>
          )}

          <Circle
            center={{ lat, lng }}
            radius={Math.max(10, Number(radiusMeters) || 150)}
            strokeColor="#059669"
            strokeOpacity={0.85}
            strokeWeight={2}
            fillColor="#10b981"
            fillOpacity={0.18}
            clickable={false}
          />
        </GoogleMap>

        {canEdit && (
          <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm text-[10px] font-semibold text-emerald-950 flex items-center gap-1.5 pointer-events-none">
            <Navigation className="w-3 h-3 text-emerald-600" />
            <span>Klik peta atau geser pin hijau untuk menyesuaikan titik koordinat</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const GoogleMapsCoordinatePicker: React.FC<GoogleMapsCoordinatePickerProps> = (props) => {
  const [hasLoadError, setHasLoadError] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const handleApiLoad = useCallback(() => {
    setHasLoadError(false);
  }, []);

  const handleApiError = useCallback((error: unknown) => {
    setHasLoadError(true);
    console.warn('Google Maps script tidak dapat dimuat; menggunakan mode input koordinat manual:', error);
  }, []);

  const handleRetryLoad = useCallback(() => {
    if (typeof document !== 'undefined') {
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      existingScripts.forEach((el) => el.remove());
    }
    setHasLoadError(false);
    setReloadCounter((prev) => prev + 1);
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold">Kunci API Google Maps belum dikonfigurasi.</div>
          <p className="text-[11px] text-amber-800 mt-0.5">
            Pastikan Google Maps Platform telah diaktifkan untuk menggunakan pencarian lokasi di peta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider
      key={reloadCounter}
      apiKey={GOOGLE_MAPS_API_KEY}
      libraries={GOOGLE_MAPS_LIBRARIES}
      language="id"
      region="ID"
      onLoad={handleApiLoad}
      onError={handleApiError}
    >
      <MapCoordinatePickerInner
        {...props}
        hasLoadError={hasLoadError}
        onRetryLoad={handleRetryLoad}
      />
    </APIProvider>
  );
};
