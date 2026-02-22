import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  try {
    // Nominatim (OpenStreetMap) 무료 지오코딩 서비스 사용
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'MatZip-ChatGi-App', // Nominatim은 User-Agent 필수
        },
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      const { lat, lon, display_name } = data[0];
      return NextResponse.json({
        lat: parseFloat(lat),
        lng: parseFloat(lon),
        roadAddress: display_name,
        jibunAddress: display_name,
      });
    } else {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
