// TMAP API 타입 정의
declare global {
  interface Window {
    Tmapv2: {
      Map: new (container: HTMLElement, options: TmapOptions) => TmapInstance;
      LatLng: new (lat: number, lng: number) => TmapLatLng;
    };
  }
}

interface TmapOptions {
  center: TmapLatLng;
  width: string;
  height: string;
  zoom: number;
}

interface TmapLatLng {
  lat(): number;
  lng(): number;
}

interface TmapInstance {
  setCenter(latlng: TmapLatLng): void;
  setZoom(zoom: number): void;
}

export {};
