// TMAP API 타입 정의
declare global {
  interface Window {
    Tmapv2: {
      Map: new (container: HTMLElement, options: TmapOptions) => TmapInstance;
      Point: new (lng: number, lat: number) => TmapPoint;
      LatLng: new (lat: number, lng: number) => TmapLatLng;
    };
  }
}

interface TmapOptions {
  center: TmapPoint | TmapLatLng;
  width: string;
  height: string;
  zoom: number;
}

interface TmapPoint {
  _lng: number;
  _lat: number;
}

interface TmapLatLng {
  lat(): number;
  lng(): number;
}

interface TmapInstance {
  setCenter(point: TmapPoint | TmapLatLng): void;
  setZoom(zoom: number): void;
}

export {};
