'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
};

const mockRestaurants: Restaurant[] = [
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
  {
    id: '3',
    name: '대선칼국수',
    address: '대전 서구 둔산중로40번길 28 오성빌딩 2층',
    distance: 'A',
    category: '한식',
    lat: 36.3510,
    lng: 127.3850,
  },
  {
    id: '4',
    name: '기쁨이김밥',
    address: '대전둔산점 대전 서구 둔산로 108',
    distance: 'A',
    category: '분식',
    lat: 36.3498,
    lng: 127.3838,
  },
  {
    id: '5',
    name: '김명태 고기의 철학',
    address: '대전 서구 둔산중로46번길 38',
    distance: 'A',
    category: '고기',
    lat: 36.3515,
    lng: 127.3855,
  },
];

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
};

function RestaurantCard({ restaurant, onToggleFavorite }: RestaurantCardProps) {
  const distanceText = restaurant.calculatedDistance 
    ? formatDistance(restaurant.calculatedDistance)
    : '거리 계산 중...';
    
  return (
    <div className="flex items-start justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
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
          onClick={() => onToggleFavorite(restaurant.id)}
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
  const [restaurants, setRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [restaurantMarkers, setRestaurantMarkers] = useState<Array<{ lat: number; lng: number; name: string; address: string; distance: number }>>([]);
  const { showMobileMenu, toggleMobileMenu } = useUserStore(); // zustand store 사용
  const router = useRouter();

  const profileHref = isLoggedIn ? '/mypage' : '/login';

  // 사용자 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error);
          // 기본 위치 (대전 둔산동)로 설정
          setUserLocation({ lat: 36.3504, lng: 127.3845 });
        }
      );
    } else {
      // Geolocation을 지원하지 않는 브라우저
      console.warn('브라우저가 위치 정보를 지원하지 않습니다.');
      setUserLocation({ lat: 36.3504, lng: 127.3845 });
    }
  }, []);

  // 음식점 주소 지오코딩 및 거리 계산
  useEffect(() => {
    if (!userLocation) return;
    
    const geocodeRestaurants = async () => {
      const markers: Array<{ lat: number; lng: number; name: string; address: string; distance: number }> = [];
      const updatedRestaurants: Restaurant[] = [];
      
      for (const restaurant of restaurants) {
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
          if (restaurant !== restaurants[restaurants.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          console.log(`📍 Using existing coords: ${restaurant.name} at (${lat}, ${lng})`);
        }
        
        // 거리 계산
        const distanceInMeters = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          lat,
          lng
        );
        
        console.log(`📏 Distance to ${restaurant.name}: ${formatDistance(distanceInMeters)}`);
        
        markers.push({
          lat,
          lng,
          name: restaurant.name,
          address: restaurant.address,
          distance: distanceInMeters,
        });
        
        updatedRestaurants.push({
          ...restaurant,
          lat,
          lng,
          calculatedDistance: distanceInMeters,
        });
      }
      
      console.log(`📍 Total markers: ${markers.length} / ${restaurants.length}`);
      setRestaurantMarkers(markers);
      
      // 거리 정보가 추가된 restaurants 업데이트
      if (updatedRestaurants.length > 0) {
        setRestaurants(updatedRestaurants);
      }
    };

    if (restaurants.length > 0) {
      geocodeRestaurants();
    }
  }, [userLocation]); // userLocation 변경 시에만 실행

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
            const favData = docSnap.data();
            setRestaurants((prev) =>
              prev.map((restaurant) => ({
                ...restaurant,
                isFavorite: favData[restaurant.id] === true,
              }))
            );
          }
        } catch (error) {
          console.error('즐겨찾기 불러오기 실패:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const favoriteCount = useMemo(
    () => restaurants.filter((item) => item.isFavorite).length,
    [restaurants]
  );

  const toggleFavorite = async (id: string) => {
    const restaurant = restaurants.find((r) => r.id === id);
    if (!restaurant) return;

    const newFavoriteStatus = !restaurant.isFavorite;

    // UI 업데이트
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
        {
          [id]: newFavoriteStatus,
        },
        { merge: true }
      );
    } catch (error) {
      console.error('즐겨찾기 저장 실패:', error);
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

  return (
    <div className="h-screen bg-gray-200 flex flex-col">
      {/* 데스크톱: 사이드바 + 지도 레이아웃 */}
      {/* 모바일: 전체화면 지도 + 플로팅 카드 */}
      
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left Panel - Desktop */}
        <aside className="w-full max-w-md bg-white shadow-xl rounded-r-2xl p-6 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="space-y-1">
              <div className="text-[11px] text-gray-500">반경 500m 이내</div>
              <div className="text-lg font-semibold text-gray-900">주변 음식점</div>
              <div className="text-[11px] text-gray-400">
                즐겨찾기 {favoriteCount}개 • 총 {restaurants.length}곳
              </div>
            </div>
            <span className="text-[11px] text-gray-400">Q · A</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onToggleFavorite={handleFavoriteClick}
              />
            ))}
          </div>
        </aside>

        {/* Map - Desktop */}
        <div className="flex-1 bg-slate-100">
          {userLocation ? (
            <NaverMap 
              center={userLocation}
              zoom={15}
              markers={restaurantMarkers}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              위치 정보를 불러오는 중...
            </div>
          )}
        </div>
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
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100">
              위치 정보를 불러오는 중...
            </div>
          )}
        </div>

        {/* Floating Restaurant Card - Mobile (슬라이드 메뉴) */}
        <div 
          className={`absolute bottom-0 left-0 right-0 z-30 transition-transform duration-300 ease-in-out ${
            showMobileMenu ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="bg-white rounded-t-3xl shadow-2xl p-5 max-h-[70vh] flex flex-col">
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">반경 500m 이내</div>
              <h2 className="text-lg font-bold text-gray-900">주변 음식점들</h2>
            </div>

            {/* Restaurant List */}
            <div className="flex-1 space-y-2 overflow-y-auto mb-4">
              {restaurants.map((restaurant) => {
                const distanceText = restaurant.calculatedDistance 
                  ? formatDistance(restaurant.calculatedDistance)
                  : '계산 중...';
                  
                return (
                  <div key={restaurant.id} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-start gap-2 flex-1">
                      <button
                        type="button"
                        onClick={() => handleFavoriteClick(restaurant.id)}
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
    </div>
  );
}
