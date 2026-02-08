'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import NaverMap from '@/components/NaverMap';

type Restaurant = {
  id: string;
  name: string;
  address: string;
  distance: string;
  category: string;
  isFavorite?: boolean;
};

const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: '보배반점',
    address: '대전광역시 서구 둔산동 1491 1층',
    distance: 'A',
    category: '중식',
  },
  {
    id: '2',
    name: '고봉민김밥',
    address: '대전광역시 서구 둔산로 133 (둔산동, 109호)',
    distance: 'A',
    category: '한식',
  },
  {
    id: '3',
    name: '대선칼국수',
    address: '대전 서구 둔산중로40번길 28 오성빌딩 2층',
    distance: 'A',
    category: '한식',
  },
  {
    id: '4',
    name: '기쁨이김밥',
    address: '대전둔산점 대전 서구 둔산로 108',
    distance: 'A',
    category: '분식',
  },
  {
    id: '5',
    name: '김명태 고기의 철학',
    address: '대전 서구 둔산중로46번길 38',
    distance: 'A',
    category: '고기',
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
  return (
    <div className="flex items-start justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-xs text-gray-500">반경 500m</span>
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
  const router = useRouter();

  const profileHref = isLoggedIn ? '/mypage' : '/login';

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
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel */}
        <aside className="w-full md:max-w-md bg-white shadow-xl md:rounded-r-2xl p-4 md:p-6 flex flex-col gap-4 max-h-[50vh] md:max-h-none overflow-hidden">
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

        {/* Map Placeholder */}
        <div className="flex-1 bg-slate-100 h-[50vh] md:h-auto">
          <NaverMap 
            center={{ lat: 36.3504, lng: 127.3845 }}
            zoom={15}
          />
        </div>
      </div>

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

        {/* Floating Food Recommendation Button */}
        <Link 
          href="/recommendation"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 md:bottom-8 z-40 group"
        >
          <div className="bg-gradient-to-br from-yellow-100 to-amber-100 px-8 py-3 md:px-20 md:py-5 rounded-2xl md:rounded-3xl shadow-xl hover:shadow-xl hover:scale-105 transform transition-all duration-300 border-2 border-yellow-200">
            <span className="font-black text-base md:text-2xl text-gray-900 whitespace-nowrap">주변 음식점 추천받기</span>
          </div>
        </Link>
    </div>
  );
}
