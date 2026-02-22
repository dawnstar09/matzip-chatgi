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

type OptionGroup = {
  title: string;
  options: string[];
};

// 메인 페이지와 동일한 레스토랑 목록
const allRestaurants: Restaurant[] = [
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

const optionGroups: OptionGroup[] = [
  { title: '음식 유형', options: ['식사', '요리', '간식'] },
  { title: '카테고리', options: ['한식', '중식', '일식', '양식', '아시아'] },
  { title: '상황', options: ['혼밥', '친구', '연인', '가족', '모임'] },
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

export default function MyPage() {
  const router = useRouter();
  const { user: storeUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [checkedGroups, setCheckedGroups] = useState<Record<string, boolean>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, Set<string>>>(() => {
    const initial: Record<string, Set<string>> = {};
    optionGroups.forEach((group) => {
      initial[group.title] = new Set();
    });
    return initial;
  });
  const [activeTab, setActiveTab] = useState<'restaurants' | 'weights'>('restaurants');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserEmail(user.email || '');
      setUserName(user.displayName || user.email || '');

      // Firestore에서 즐겨찾기 불러오기
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

      setLoading(false);
    });
    return () => unsub();
  }, [router]);

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

  const toggleGroupOption = (group: string, option: string) => {
    setSelectedOptions((prev) => {
      const current = new Set(prev[group]);
      if (option === '전체') {
        current.clear();
        return { ...prev, [group]: current };
      }
      if (current.has(option)) current.delete(option);
      else current.add(option);
      return { ...prev, [group]: current };
    });
  };

  const isOptionActive = (group: string, option: string) => {
    const current = selectedOptions[group];
    if (!current) return false;
    if (option === '전체') return current.size === 0;
    return current.has(option);
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

              {/* Recommendation Options */}
              <section className="bg-white rounded-2xl shadow p-6 border border-gray-100 space-y-4">
                <div className="text-[11px] text-gray-500">본인만의 특징을 반영한 메뉴를 추천받으세요!</div>
                <h3 className="text-sm font-semibold text-gray-900">음식점 추천 옵션 설정</h3>
                <div className="flex items-center justify-between text-sm font-medium text-gray-800">
                  <div className="flex items-center gap-2">
                    <input
                      id="menu-option-toggle"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                      checked={checkedGroups['추천옵션'] ?? true}
                      onChange={(e) =>
                        setCheckedGroups((prev) => ({ ...prev, 추천옵션: e.target.checked }))
                      }
                    />
                    <label htmlFor="menu-option-toggle">음식점 메뉴 추천 옵션</label>
                  </div>
                  <span className="text-xs text-gray-400">Q · A</span>
                </div>

                <div className="space-y-3">
                  {optionGroups.map((group) => (
                    <div key={group.title} className="bg-gray-100 border border-gray-300 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-12 divide-x divide-gray-300 text-sm">
                        <button
                          type="button"
                          className={`col-span-2 py-3 font-semibold text-white ${isOptionActive(group.title, '전체') ? 'bg-blue-700' : 'bg-blue-500'} hover:bg-blue-600`}
                          onClick={() => toggleGroupOption(group.title, '전체')}
                        >
                          전체
                        </button>
                        <div className="col-span-10 grid grid-cols-5">
                          {group.options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              className={`py-3 text-center transition-colors ${isOptionActive(group.title, opt) ? 'bg-blue-100 text-blue-900 font-semibold' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                              onClick={() => toggleGroupOption(group.title, opt)}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 mt-6 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors duration-200"
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
