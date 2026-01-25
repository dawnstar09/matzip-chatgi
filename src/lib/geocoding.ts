interface GeocodingResult {
  lat: number;
  lng: number;
  roadAddress: string;
  jibunAddress: string;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
