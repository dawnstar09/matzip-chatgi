'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import NaverMap from '@/components/NaverMap';
import useUserStore from '@/store/userStore';
import { geocodeAddress } from '@/lib/geocoding';
import { calculateDistance, formatDistance } from '@/lib/distance';

type Restaurant = {
  id: string;
  name: string;
  address: string;
  distance: string;
  category: string;
  isFavorite?: boolean;
  lat?: number;
  lng?: number;
  calculatedDistance?: number; // 실제 계산된 거리 (미터)
  telno?: string; // 전화번호
  openHours?: string; // 영업시간
  representativeMenu?: string; // 대표메뉴
  menuNames?: string[]; // 메뉴 이름 목록
  menuPrices?: string[]; // 메뉴 가격 목록
  naverUrl?: string; // 네이버 지도 URL
};

// API 응답 데이터 타입 (실제 API 구조에 맞게 조정 필요)
interface ApiStoreData {
  [key: string]: any; // API 응답 구조를 확인한 후 구체적으로 정의
}

// API 데이터를 Restaurant 타입으로 변환하는 함수
function mapApiDataToRestaurant(apiData: any, index: number): Restaurant {
  // 대전 빅데이터 API 실제 필드명: REST_NM, ADDR, TOB_INFO, LAT, LOT, REST_ID
  return {
    id: apiData.REST_ID?.toString() || index.toString(),
    name: apiData.REST_NM || '상호명 없음',
    address: apiData.ADDR || '주소 정보 없음',
    distance: 'A',
    category: apiData.TOB_INFO || '기타',
    isFavorite: false, // 기본값은 즐겨찾기 안됨
    lat: apiData.LAT ? parseFloat(apiData.LAT) : undefined,
    lng: apiData.LOT ? parseFloat(apiData.LOT) : undefined,
    telno: apiData.TELNO || undefined,
    openHours: apiData.OPEN_HR_INFO || undefined,
    representativeMenu: apiData.RPRS_MENU_NM || undefined,
    menuNames: apiData.MENU_KORN_NM || [],
    menuPrices: apiData.MENU_AMT || [],
    naverUrl: apiData.SD_URL || undefined,
  };
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill={filled ? '#facc15' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 22 12 18.56 5.8 22 7 14.14 2 9.27l7.1-1.01L12 2z" />
    </svg>
  );
}

type RestaurantCardProps = {
  restaurant: Restaurant;
  onToggleFavorite: (id: string) => void;
  onClick?: (restaurant: Restaurant) => void;
  isSelected?: boolean;
};

function RestaurantCard({ restaurant, onToggleFavorite, onClick, isSelected }: RestaurantCardProps) {
  const distanceText = restaurant.calculatedDistance 
    ? formatDistance(restaurant.calculatedDistance)
    : '거리 계산 중...';
    
  return (
    <div 
      className={`flex items-start justify-between rounded-xl border px-4 py-3 shadow-sm cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-300'
      }`}
      onClick={() => onClick?.(restaurant)}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-xs font-semibold text-blue-600">{distanceText}</span>
          <span className="text-[10px] text-gray-400">{restaurant.category}</span>
        </div>
        <div className="text-base font-semibold text-gray-900">{restaurant.name}</div>
        <div className="text-sm text-gray-500 leading-tight">{restaurant.address}</div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          className="text-gray-500 hover:text-yellow-500 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(restaurant.id);
          }}
          aria-label={restaurant.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <StarIcon filled={Boolean(restaurant.isFavorite)} />
        </button>
        <span className="text-xs text-gray-400">Q · A</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [restaurantMarkers, setRestaurantMarkers] = useState<Array<{ lat: number; lng: number; name: string; address: string; distance: number; restaurantId: string }>>([]);
  const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance'); // 정렬 기준
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null); // 선택된 음식점
  const { showMobileMenu, toggleMobileMenu } = useUserStore(); // zustand store 사용
  const router = useRouter();

  // Firebase 즐겨찾기 타이밍 문제 해결:
  // Firestore 데이터가 음식점 API보다 먼저 도착할 수 있어 ref에 저장해 두고 나중에 적용
  const storedFavoritesRef = useRef<Record<string, boolean>>({});

  const profileHref = isLoggedIn ? '/mypage' : '/login';

  // 기기 감지 헬퍼
  const getDeviceType = (): 'ios' | 'android' | 'desktop' => {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
  };

  // 사용자 현재 위치 가져오기
  const requestLocation = () => {
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('이 브라우저는 위치 정보를 지원하지 않습니다. Chrome 또는 Safari를 사용해주세요.');
      setUserLocation({ lat: 36.3504, lng: 127.3845 });
      return;
    }

    const device = getDeviceType();

    // Permissions API로 현재 권한 상태를 먼저 확인 (지원하는 브라우저에서)
    if (typeof navigator.permissions !== 'undefined') {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log('📍 Permission state:', result.state);
        if (result.state === 'denied') {
          // 이미 거부된 경우: 팝업 없이 바로 에러 → 설정 안내
          let guide = '';
          if (device === 'ios') {
            guide = '거부된 권한 복구 방법: 설정 앱 → Safari → 위치 → "방문하는 동안 허용" 선택 후 이 페이지를 새로고침해주세요.';
          } else if (device === 'android') {
            guide = '거부된 권한 복구 방법: 주소창 왼쪽 자물쇠(🔒) → 위치 → 허용으로 변경 후 새로고침해주세요.';
          } else {
            guide = '거부된 권한 복구 방법: 주소창 왼쪽 아이콘 클릭 → 위치 권한 허용으로 변경 후 새로고침해주세요.';
          }
          setLocationError(guide);
          setUserLocation({ lat: 36.3504, lng: 127.3845 });
          return;
        }
        // granted 또는 prompt 상태이면 실제 요청
        doGetLocation(device);
      }).catch(() => {
        // Permissions API 실패 시 그냥 요청
        doGetLocation(device);
      });
    } else {
      doGetLocation(device);
    }
  };

  const doGetLocation = (device: 'ios' | 'android' | 'desktop') => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
        console.log('✅ 위치 정보 허용됨:', position.coords);
      },
      (error) => {
        console.error('위치 정보 오류 코드:', error.code, error.message);
        
        let errorMsg = '';
        if (error.code === error.PERMISSION_DENIED) {
          if (device === 'ios') {
            errorMsg = '📵 위치 권한 거부됨\n\n설정 앱 → Safari → 위치 → "방문하는 동안 허용" 선택 후 이 페이지를 새로고침하세요.\n\n(인앱 브라우저라면 Safari로 직접 열어주세요)';
          } else if (device === 'android') {
            errorMsg = '📵 위치 권한 거부됨\n\n주소창 왼쪽 🔒 아이콘 → 위치 → "허용"으로 변경하고 새로고침하세요.';
          } else {
            errorMsg = '📵 위치 권한 거부됨\n\n주소창 왼쪽 아이콘 클릭 → 위치 권한을 "허용"으로 변경 후 새로고침하세요.';
          }
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = '위치 신호를 받을 수 없습니다. 실내라면 창가로 이동하거나 Wi-Fi를 연결해보세요.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = '위치 요청 시간이 초과되었습니다. 재시도 버튼을 눌러주세요.';
        } else {
          errorMsg = '알 수 없는 오류가 발생했습니다. 재시도해주세요.';
        }
        
        setLocationError(errorMsg);
        setUserLocation({ lat: 36.3504, lng: 127.3845 });
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000, // 1분 이내 캐시된 위치 재사용 (iOS 호환성 향상)
      }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // 대전 빅데이터 API에서 음식점 데이터 가져오기
  useEffect(() => {
    const fetchRestaurants = async () => {
      console.log('🔄 음식점 데이터 로딩 중...');
      setLoading(true);
      
      try {
        const response = await fetch('/api/stores');
        
        if (!response.ok) {
          throw new Error('음식점 데이터 가져오기 실패');
        }
        
        const data = await response.json();
        console.log('📦 API 응답 데이터:', data);
        
        // API 응답 구조 확인 후 매핑
        let storeList: any[] = [];
        
        // 다양한 API 응답 구조 처리
        if (Array.isArray(data)) {
          storeList = data;
        } else if (data.results && Array.isArray(data.results)) {
          storeList = data.results;
        } else if (data.data && Array.isArray(data.data)) {
          storeList = data.data;
        } else if (data.stores && Array.isArray(data.stores)) {
          storeList = data.stores;
        } else if (data.list && Array.isArray(data.list)) {
          storeList = data.list;
        } else {
          console.warn('⚠️ 예상치 못한 API 응답 구조:', data);
        }
        
        console.log(`📊 전체 음식점 수: ${storeList.length}개`);
        
        // 첫 번째 데이터 샘플 확인
        if (storeList.length > 0) {
          console.log('📋 데이터 샘플:', storeList[0]);
        }
        
        // 대전 지역 음식점만 필터링
        const filteredStores = storeList.filter((store: any) => {
          const address = store.ADDR || '';
          return address.includes('대전');
        });
        
        console.log(`🔍 대전 필터링 결과: ${filteredStores.length}개`);
        
        // 필터링된 결과가 없으면 전체에서 50개, 있으면 필터링 결과 전체 사용
        const mappedRestaurants = (filteredStores.length > 0 ? filteredStores : storeList)
          .slice(0, 50)
          .map((store: any, index: number) => mapApiDataToRestaurant(store, index));
        
        console.log(`✅ ${mappedRestaurants.length}개 음식점 로드 완료`);
        setRestaurants(mappedRestaurants);
      } catch (error) {
        console.error('❌ 음식점 데이터 로드 실패:', error);
        // 에러 시 기본 더미 데이터 사용
        setRestaurants([
          {
            id: '1',
            name: '보배반점',
            address: '대전광역시 서구 둔산동 1491 1층',
            distance: 'A',
            category: '중식',
            lat: 36.3501,
            lng: 127.3847,
          },
          {
            id: '2',
            name: '고봉민김밥',
            address: '대전광역시 서구 둔산로 133 (둔산동, 109호)',
            distance: 'A',
            category: '한식',
            lat: 36.3505,
            lng: 127.3842,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurants();
  }, []);


  // 음식점 주소 지오코딩 및 거리 계산
  // restaurants와 userLocation 모두 준비되었을 때 실행
  // 이미 calculatedDistance가 있으면 재실행 방지 (무한 루프 차단)
  useEffect(() => {
    if (!userLocation || restaurants.length === 0) return;

    // 이미 거리 계산 완료된 데이터면 스킵 (Firebase 업데이트 등으로 재실행 방지)
    const alreadyProcessed = restaurants.some((r) => r.calculatedDistance !== undefined);
    if (alreadyProcessed) return;

    // 클로저 캡처 문제 방지: 이 시점의 restaurants 스냅샷 사용
    const snapshot = [...restaurants];
    const locationSnapshot = { ...userLocation };

    const geocodeRestaurants = async () => {
      const markers: Array<{ lat: number; lng: number; name: string; address: string; distance: number; restaurantId: string }> = [];
      const updatedRestaurants: Restaurant[] = [];

      for (const restaurant of snapshot) {
        let lat = restaurant.lat;
        let lng = restaurant.lng;

        // 좌표가 없으면 지오코딩 시도
        if (lat === undefined || lng === undefined) {
          console.log(`🔍 Geocoding: ${restaurant.name} - ${restaurant.address}`);
          const result = await geocodeAddress(restaurant.address);

          if (result) {
            lat = result.lat;
            lng = result.lng;
            console.log(`✅ Success: ${restaurant.name} at (${lat}, ${lng})`);
          } else {
            console.warn(`❌ Failed to geocode: ${restaurant.name} - ${restaurant.address}`);
            updatedRestaurants.push(restaurant);
            continue;
          }

          // API rate limit 방지를 위한 딜레이
          if (restaurant !== snapshot[snapshot.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } else {
          console.log(`📍 Using existing coords: ${restaurant.name} at (${lat}, ${lng})`);
        }

        // 거리 계산
        const distanceInMeters = calculateDistance(
          locationSnapshot.lat,
          locationSnapshot.lng,
          lat,
          lng
        );

        markers.push({
          lat,
          lng,
          name: restaurant.name,
          address: restaurant.address,
          distance: distanceInMeters,
          restaurantId: restaurant.id,
        });

        updatedRestaurants.push({
          ...restaurant,
          lat,
          lng,
          calculatedDistance: distanceInMeters,
        });
      }

      console.log(`📍 Total markers: ${markers.length} / ${snapshot.length}`);

      // 거리순으로 정렬하고 가까운 50개만 유지
      if (updatedRestaurants.length > 0) {
        const sortedByDistance = updatedRestaurants
          .sort((a, b) => {
            const distA = a.calculatedDistance ?? Infinity;
            const distB = b.calculatedDistance ?? Infinity;
            return distA - distB;
          })
          .slice(0, 50);

        console.log(`📍 가까운 거리순 50개로 필터링 완료`);

        // setRestaurants: 기존 isFavorite 상태를 보존하며 업데이트
        setRestaurants((prev) => {
          const favMap: Record<string, boolean> = {};
          prev.forEach((r) => { favMap[r.id] = r.isFavorite ?? false; });
          return sortedByDistance.map((r) => ({
            ...r,
            isFavorite: favMap[r.id] ?? r.isFavorite ?? false,
          }));
        });

        // markers도 정렬된 restaurants에 맞춰 업데이트
        const sortedMarkers = sortedByDistance
          .filter(r => r.lat !== undefined && r.lng !== undefined)
          .map(r => ({
            lat: r.lat!,
            lng: r.lng!,
            name: r.name,
            address: r.address,
            distance: r.calculatedDistance!,
            restaurantId: r.id,
          }));
        setRestaurantMarkers(sortedMarkers);
      } else {
        setRestaurantMarkers(markers);
      }
    };

    geocodeRestaurants();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, restaurants]); // restaurants 로드 후에도 트리거되도록 추가

  // 실사용 시 로그인 상태를 Firebase Auth로 동기화
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user);
      setCurrentUserName(user?.displayName || user?.email || '');
      setAuthReady(true);

      // 로그인 시 Firestore에서 즐겨찾기 불러오기
      if (user) {
        try {
          const userFavRef = doc(db, 'favorites', user.uid);
          const docSnap = await getDoc(userFavRef);

          if (docSnap.exists()) {
            const favData = docSnap.data() as Record<string, boolean>;
            // ref에 저장 (음식점 로드 전에 도착해도 나중에 적용 가능)
            storedFavoritesRef.current = favData;
            // 현재 state에도 즉시 적용 (이미 로드된 경우 즉시 반영)
            setRestaurants((prev) =>
              prev.map((restaurant) => ({
                ...restaurant,
                isFavorite: favData[restaurant.id] === true,
              }))
            );
            console.log('⭐ 즐겨찾기 로드 완료');
          }
        } catch (error) {
          console.error('즐겨찾기 불러오기 실패:', error);
          // 에러가 나도 앱은 정상 작동 (isFavorite = false 유지)
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 로딩 완료 후 즐겨찾기 재적용:
  // Firestore 데이터가 음식점 API보다 먼저 왔다면 여기서 다시 적용
  useEffect(() => {
    if (!loading && Object.keys(storedFavoritesRef.current).length > 0) {
      setRestaurants((prev) =>
        prev.map((r) => ({
          ...r,
          isFavorite: storedFavoritesRef.current[r.id] === true,
        }))
      );
      console.log('⭐ 즐겨찾기 재적용 완료 (loading 해제 후)');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]); // loading false가 되는 시점에 1회 실행

  const favoriteCount = useMemo(
    () => restaurants.filter((item) => item.isFavorite).length,
    [restaurants]
  );

  // 정렬된 레스토랑 리스트
  const sortedRestaurants = useMemo(() => {
    const sorted = [...restaurants];
    if (sortBy === 'distance') {
      return sorted.sort((a, b) => {
        const distA = a.calculatedDistance ?? Infinity;
        const distB = b.calculatedDistance ?? Infinity;
        return distA - distB;
      });
    } else {
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }
  }, [restaurants, sortBy]);

  const toggleFavorite = async (id: string) => {
    const restaurant = restaurants.find((r) => r.id === id);
    if (!restaurant) return;

    const newFavoriteStatus = !restaurant.isFavorite;

    // ref에도 반영 (loading useEffect가 나중에 덮어쓰지 않도록)
    storedFavoritesRef.current = {
      ...storedFavoritesRef.current,
      [id]: newFavoriteStatus,
    };

    // UI 즉시 업데이트
    setRestaurants((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: newFavoriteStatus } : item
      )
    );

    // Firestore에 저장
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userFavRef = doc(db, 'favorites', user.uid);
      await setDoc(
        userFavRef,
        { [id]: newFavoriteStatus },
        { merge: true }
      );
    } catch (error) {
      console.error('즐겨찾기 저장 실패:', error);
      // 저장 실패 시 UI 롤백
      storedFavoritesRef.current = {
        ...storedFavoritesRef.current,
        [id]: !newFavoriteStatus,
      };
      setRestaurants((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isFavorite: !newFavoriteStatus } : item
        )
      );
    }
  };

  const handleFavoriteClick = (id: string) => {
    // 인증 상태가 아직 확인되지 않았거나 로그인되지 않은 경우 팝업 표시
    if (!authReady || !isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    toggleFavorite(id);
  };

  const handleMarkerClick = (restaurantId: string) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      setSelectedRestaurant(restaurant);
    }
  };

  // 로딩 중 UI (h-full 사용: Navbar가 포함된 layout 안에서 남은 공간 채움)
  if (loading) {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">음식점 데이터를 불러오는 중...</p>
          <p className="text-gray-400 text-sm mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-200 flex flex-col">
      {/* 데스크톱: 사이드바 + 지도 레이아웃 */}
      {/* 모바일: 전체화면 지도 + 플로팅 카드 */}
      
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left Panel - Desktop */}
        <aside className="w-full max-w-md bg-white shadow-xl rounded-r-2xl p-6 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="space-y-1">
              <div className="text-[11px] text-gray-500">반경 500m 이내</div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold text-gray-900">주변 음식점</div>
                <div className="flex items-center rounded-lg overflow-hidden border border-gray-300">
                  <button
                    onClick={() => setSortBy('distance')}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      sortBy === 'distance'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    거리순
                  </button>
                  <button
                    onClick={() => setSortBy('name')}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      sortBy === 'name'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    이름순
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-gray-400">
                즐겨찾기 {favoriteCount}개 • 총 {restaurants.length}곳
              </div>
            </div>
            <span className="text-[11px] text-gray-400">Q · A</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {sortedRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onToggleFavorite={handleFavoriteClick}
                onClick={setSelectedRestaurant}
                isSelected={selectedRestaurant?.id === restaurant.id}
              />
            ))}
          </div>
        </aside>

        {/* Map - Desktop */}
        <div className="flex-1 bg-slate-100 relative">
          {userLocation ? (
            <NaverMap 
              center={userLocation}
              zoom={15}
              markers={restaurantMarkers}
              onMarkerClick={handleMarkerClick}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              위치 정보를 불러오는 중...
            </div>
          )}
          
          {/* 위치 에러 안내 */}
          {locationError && (
            <div className="absolute top-4 left-4 right-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg z-10 max-w-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-0.5">
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-yellow-800">위치 정보를 가져올 수 없습니다</h3>
                  <p className="text-xs text-yellow-700 mt-1 whitespace-pre-line leading-relaxed">{locationError}</p>
                  <p className="text-xs text-yellow-600 mt-2 font-medium">현재 기본 위치(대전 둔산동)로 표시 중입니다.</p>
                </div>
                <button
                  onClick={requestLocation}
                  className="flex-shrink-0 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-xs font-semibold px-3 py-1.5 rounded transition-colors whitespace-nowrap"
                >
                  재시도
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel - Desktop (오른쪽) */}
        {selectedRestaurant && (
          <aside className="w-full max-w-md bg-white shadow-xl rounded-l-2xl p-6 flex flex-col gap-4 overflow-y-auto">
            {/* 닫기 버튼 */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedRestaurant.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedRestaurant.category}</p>
              </div>
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 기본 정보 */}
            <div className="space-y-3 border-t pt-4">
              {selectedRestaurant.calculatedDistance && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">📍 거리</span>
                  <span className="font-semibold text-blue-600">
                    {formatDistance(selectedRestaurant.calculatedDistance)}
                  </span>
                </div>
              )}
              
              <div className="flex items-start gap-2 text-sm">
                <span className="text-gray-600">📍 주소</span>
                <span className="text-gray-900">{selectedRestaurant.address}</span>
              </div>

              {selectedRestaurant.telno && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">📞 전화</span>
                  <a href={`tel:${selectedRestaurant.telno}`} className="text-blue-600 hover:underline">
                    {selectedRestaurant.telno}
                  </a>
                </div>
              )}

              {selectedRestaurant.openHours && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-600">🕐 영업시간</span>
                  <span className="text-gray-900">{selectedRestaurant.openHours}</span>
                </div>
              )}
            </div>

            {/* 대표 메뉴 */}
            {selectedRestaurant.representativeMenu && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">🍽️ 대표메뉴</h3>
                <p className="text-base font-medium text-gray-900">{selectedRestaurant.representativeMenu}</p>
              </div>
            )}

            {/* 메뉴판 */}
            {selectedRestaurant.menuNames && selectedRestaurant.menuNames.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 메뉴</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedRestaurant.menuNames.map((menuName, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-900">{menuName}</span>
                      {selectedRestaurant.menuPrices?.[index] && (
                        <span className="text-sm font-semibold text-gray-700">
                          {selectedRestaurant.menuPrices[index]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 네이버 지도 링크 */}
            {selectedRestaurant.naverUrl && (
              <div className="border-t pt-4">
                <a
                  href={selectedRestaurant.naverUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg text-center transition-colors"
                >
                  네이버 지도에서 보기
                </a>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex-1 relative">
        {/* Full Screen Map */}
        <div className="absolute inset-0">
          {userLocation ? (
            <NaverMap 
              center={userLocation}
              zoom={15}
              markers={restaurantMarkers}
              onMarkerClick={handleMarkerClick}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100">
              위치 정보를 불러오는 중...
            </div>
          )}
        </div>

        {/* 위치 에러 안내 - Mobile */}
        {locationError && (
          <div className="absolute top-4 left-4 right-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-lg shadow-lg z-30">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-yellow-800">위치 권한 오류</h3>
                <p className="text-xs text-yellow-700 mt-0.5 whitespace-pre-line leading-relaxed">{locationError}</p>
              </div>
              <button
                onClick={requestLocation}
                className="flex-shrink-0 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-xs font-semibold px-2 py-1 rounded transition-colors whitespace-nowrap"
              >
                재시도
              </button>
            </div>
          </div>
        )}

        {/* Floating Restaurant Card - Mobile (슬라이드 메뉴) */}
        <div 
          className={`fixed bottom-0 inset-x-0 md:hidden z-40 transition-transform duration-300 ease-in-out ${
            showMobileMenu ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="bg-white rounded-t-3xl shadow-2xl p-5 max-h-[70vh] flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">반경 500m 이내</div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">주변 음식점들</h2>
                  <div className="flex items-center rounded-lg overflow-hidden border border-gray-300">
                    <button
                      onClick={() => setSortBy('distance')}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        sortBy === 'distance'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      거리순
                    </button>
                    <button
                      onClick={() => setSortBy('name')}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        sortBy === 'name'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      이름순
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="메뉴 닫기"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Restaurant List */}
            <div className="flex-1 space-y-2 overflow-y-auto mb-4">
              {sortedRestaurants.map((restaurant) => {
                const distanceText = restaurant.calculatedDistance 
                  ? formatDistance(restaurant.calculatedDistance)
                  : '계산 중...';
                  
                return (
                  <div 
                    key={restaurant.id} 
                    className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-lg px-2"
                    onClick={() => setSelectedRestaurant(restaurant)}
                  >
                    <div className="flex items-start gap-2 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavoriteClick(restaurant.id);
                        }}
                        className="mt-0.5"
                      >
                        <StarIcon filled={Boolean(restaurant.isFavorite)} />
                      </button>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{restaurant.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 leading-tight">{restaurant.address}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 whitespace-nowrap ml-2">{distanceText}</span>
                  </div>
                );
              })}
            </div>

            {/* Recommendation Button */}
            <Link 
              href="/recommendation"
              className="block"
            >
              <button
                type="button"
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 rounded-2xl transition-colors text-base"
              >
                주변 음식점 추천받기
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop Floating Button */}
      <Link 
        href="/recommendation"
        className="hidden md:block fixed bottom-8 left-8 z-40 group"
      >
        <div className="bg-gradient-to-br from-yellow-100 to-amber-100 px-20 py-5 rounded-3xl shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300 border-2 border-yellow-200">
          <span className="font-black text-2xl text-gray-900 whitespace-nowrap">주변 음식점 추천받기</span>
        </div>
      </Link>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요한 기능입니다</h2>
            <p className="text-sm text-gray-600 mb-6">
              즐겨찾기를 사용하려면 먼저 로그인해주세요.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                onClick={() => setShowLoginPrompt(false)}
              >
                닫기
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-black hover:bg-yellow-500"
                onClick={() => router.push('/login')}
              >
                로그인으로 이동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restaurant Detail Modal - Mobile */}
      {selectedRestaurant && (
        <div className="md:hidden fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="p-5">
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedRestaurant.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedRestaurant.category}</p>
              </div>
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                aria-label="닫기"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 기본 정보 */}
            <div className="space-y-3 border-t pt-4">
              {selectedRestaurant.calculatedDistance && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">📍 거리</span>
                  <span className="font-semibold text-blue-600">
                    {formatDistance(selectedRestaurant.calculatedDistance)}
                  </span>
                </div>
              )}
              
              <div className="flex items-start gap-2 text-sm">
                <span className="text-gray-600">📍 주소</span>
                <span className="text-gray-900">{selectedRestaurant.address}</span>
              </div>

              {selectedRestaurant.telno && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">📞 전화</span>
                  <a href={`tel:${selectedRestaurant.telno}`} className="text-blue-600 hover:underline">
                    {selectedRestaurant.telno}
                  </a>
                </div>
              )}

              {selectedRestaurant.openHours && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-600">🕐 영업시간</span>
                  <span className="text-gray-900 whitespace-pre-line">{selectedRestaurant.openHours}</span>
                </div>
              )}
            </div>

            {/* 대표 메뉴 */}
            {selectedRestaurant.representativeMenu && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">🍽️ 대표메뉴</h3>
                <p className="text-base font-medium text-gray-900">{selectedRestaurant.representativeMenu}</p>
              </div>
            )}

            {/* 메뉴판 */}
            {selectedRestaurant.menuNames && selectedRestaurant.menuNames.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 메뉴</h3>
                <div className="space-y-2">
                  {selectedRestaurant.menuNames.map((menuName, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-900">{menuName}</span>
                      {selectedRestaurant.menuPrices?.[index] && (
                        <span className="text-sm font-semibold text-gray-700">
                          {selectedRestaurant.menuPrices[index]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 네이버 지도 링크 */}
            {selectedRestaurant.naverUrl && (
              <div className="border-t pt-4 mt-4">
                <a
                  href={selectedRestaurant.naverUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg text-center transition-colors"
                >
                  네이버 지도에서 보기
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
