'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import useUserStore from '@/store/userStore';
import MyPageContent from '@/components/MyPageContent';

type Restaurant = {
  id: string;
  name: string;
  address: string;
  distance: string;
  category: string;
  isFavorite?: boolean;
};

// API 데이터를 Restaurant 타입으로 변환하는 함수
function mapApiDataToRestaurant(apiData: any, index: number): Restaurant {
  return {
    id: apiData.id?.toString() || apiData.BIZPLC_NM || index.toString(),
    name: apiData.name || apiData.BIZPLC_NM || apiData.상호명 || '상호명 없음',
    address: apiData.address || apiData.REFINE_ROADNM_ADDR || apiData.REFINE_LOTNO_ADDR || apiData.주소 || '주소 정보 없음',
    distance: 'A',
    category: apiData.category || apiData.INDUTYPE_NM || apiData.업종 || '기타',
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

export default function MyPage() {
  const router = useRouter();
  const { user: storeUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [activeTab, setActiveTab] = useState<'restaurants' | 'weights'>('restaurants');

  // 음식점 데이터 가져오기
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch('/api/stores');
        if (!response.ok) throw new Error('음식점 데이터 가져오기 실패');
        
        const data = await response.json();
        
        let storeList: any[] = [];
        if (Array.isArray(data)) {
          storeList = data;
        } else if (data.data && Array.isArray(data.data)) {
          storeList = data.data;
        } else if (data.stores && Array.isArray(data.stores)) {
          storeList = data.stores;
        } else if (data.list && Array.isArray(data.list)) {
          storeList = data.list;
        }
        
        const mappedRestaurants = storeList
          .map((store: any, index: number) => mapApiDataToRestaurant(store, index));
        
        setAllRestaurants(mappedRestaurants);
      } catch (error) {
        console.error('음식점 데이터 로드 실패:', error);
        setAllRestaurants([]);
      }
    };
    
    fetchRestaurants();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserEmail(user.email || '');
      setUserName(user.displayName || user.email || '');

      // Firestore에서 즐겨찾기 불러오기
      if (allRestaurants.length > 0) {
        try {
          const userFavRef = doc(db, 'favorites', user.uid);
          const docSnap = await getDoc(userFavRef);
          
          if (docSnap.exists()) {
            const favData = docSnap.data();
            // 즐겨찾기된 레스토랑만 필터링
            const favoriteRestaurants = allRestaurants.filter(
              (restaurant) => favData[restaurant.id] === true
            ).map(r => ({ ...r, isFavorite: true }));
            
            setFavorites(favoriteRestaurants);
          } else {
            setFavorites([]);
          }
        } catch (error) {
          console.error('즐겨찾기 불러오기 실패:', error);
          setFavorites([]);
        }
      }

      setLoading(false);
    });
    return () => unsub();
  }, [router, allRestaurants]);

  const favoriteCount = useMemo(() => favorites.filter((f) => f.isFavorite).length, [favorites]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const toggleFavorite = async (id: string) => {
    const restaurant = favorites.find((f) => f.id === id);
    if (!restaurant) return;

    const newStatus = !restaurant.isFavorite;

    // 즐겨찾기 해제 시 목록에서 제거
    if (newStatus === false) {
      setFavorites((prev) => prev.filter((item) => item.id !== id));
    } else {
      setFavorites((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isFavorite: true } : item
        )
      );
    }

    // Firestore에 즐겨찾기 상태 저장
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userFavRef = doc(db, 'favorites', user.uid);
      await setDoc(
        userFavRef,
        {
          [id]: newStatus,
        },
        { merge: true }
      );
    } catch (error) {
      console.error('즐겨찾기 저장 실패:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
        마이페이지를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-6">
      {/* Mobile Layout */}
      <main className="md:hidden max-w-md mx-auto p-6">
        {/* User Info Card */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-4">
          <p className="text-xs text-gray-500 mb-1">{userEmail}</p>
          <h1 className="text-xl font-bold text-gray-900">
            {userName ? `${userName}님의 마이페이지` : '마이페이지'}
          </h1>
        </div>

        {/* Favorites Section */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">즐겨찾기한 음식점들</h2>
            <span className="text-xs text-gray-400">↑ A</span>
          </div>

          <div className="space-y-3">
            {favorites.length > 0 ? (
              favorites.map((fav) => (
                <div key={fav.id} className="flex items-start justify-between border-b border-gray-100 pb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(fav.id)}
                        className="text-yellow-400 hover:text-yellow-500"
                        aria-label="즐겨찾기 해제"
                      >
                        <StarIcon filled={true} />
                      </button>
                      <h3 className="font-semibold text-gray-900">{fav.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 ml-7 mt-1">{fav.address}</p>
                  </div>
                  <span className="text-xs text-gray-400 ml-2">↑A</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                아직 즐겨찾기한 음식점이 없습니다.
              </p>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full mt-6 py-4 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-full transition-colors"
        >
          로그아웃
        </button>
      </main>

      {/* Desktop Layout */}
      <main className="hidden md:flex justify-center p-6">
        <div className="w-full max-w-5xl space-y-4">
          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-2 flex gap-2">
            <button
              onClick={() => setActiveTab('restaurants')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                activeTab === 'restaurants'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              음식점 관리
            </button>
            <button
              onClick={() => setActiveTab('weights')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                activeTab === 'weights'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              음식 추천 가중치
            </button>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'restaurants' ? (
            <>
              {/* Favorites Card */}
              <section className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">{userEmail}</div>
                <h2 className="text-lg font-semibold text-gray-900">{userName || '마이페이지'}</h2>
                <div className="mt-4 text-sm font-medium text-gray-800 flex items-center gap-2">
                  즐겨찾기한 음식점들
                  <span className="text-xs text-gray-400">Q · A</span>
                </div>
                <div className="mt-3 divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden">
                  {favorites.map((fav) => (
                    <div key={fav.id} className="flex items-start justify-between bg-white px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{fav.name}</div>
                        <div className="text-xs text-gray-500">{fav.address}</div>
                      </div>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-yellow-500 transition-colors"
                        onClick={() => toggleFavorite(fav.id)}
                        aria-label={fav.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                      >
                        <StarIcon filled={Boolean(fav.isFavorite)} />
                      </button>
                    </div>
                  ))}
                  {favorites.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">즐겨찾기한 음식점이 없습니다.</div>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">즐겨찾기 {favoriteCount}개</div>
              </section>

              {/* Logout Button */}
              <section className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors duration-200"
                >
                  로그아웃
                </button>
              </section>
            </>
          ) : (
            <section className="flex flex-col items-center justify-center p-6 bg-gray-50 min-h-[calc(100vh-300px)]">
              <MyPageContent />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full max-w-2xl py-3 mt-6 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors duration-200"
              >
                로그아웃
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
