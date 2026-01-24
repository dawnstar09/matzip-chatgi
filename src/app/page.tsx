'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
    <div className="min-h-screen bg-gray-200 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-xl">M</span>
          </div>
          <span className="text-xl font-medium">TITLE</span>
        </Link>
        <div className="flex gap-4">
          <button className="w-10 h-10 hover:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </button>
          <button className="w-10 h-10 hover:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <Link
            href={profileHref}
            className="w-10 h-10 hover:bg-gray-800 rounded-full flex items-center justify-center"
            aria-label={isLoggedIn ? '마이페이지' : '로그인'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel */}
        <aside className="w-full max-w-md bg-white shadow-xl rounded-r-2xl p-6 flex flex-col gap-4">
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

          <button
            type="button"
            className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-xl shadow transition-colors duration-200"
          >
            주변 음식점 추천받기
          </button>
        </aside>

        {/* Map Placeholder */}
        <div className="flex-1 relative bg-slate-100">
          <div className="absolute inset-0 m-4 rounded-3xl border border-gray-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-inner">
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium">
              지도 영역 (Map API 연동 예정)
            </div>
          </div>
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
    </div>
  );
}
