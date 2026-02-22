'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import useUserStore from '@/store/userStore';

const initialWeightValue = 1.0;

export default function Navbar() {
  const { user, setUser, setWeights, clearUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [foodData, setFoodData] = useState<{ categories: Record<string, string[]>, cuisineTypes: string[] } | null>(null);

  useEffect(() => {
    fetch('/data/food_data.json')
      .then((res) => res.json())
      .then((data) => setFoodData(data))
      .catch(err => console.error("Failed to load food data for Navbar:", err));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && foodData) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setWeights(userDocSnap.data().weights);
          } else {
            const newWeights: {
              cuisine: Record<string, number>;
              food_group: Record<string, number>;
              food_category: Record<string, number>;
            } = {
              cuisine: {},
              food_group: {},
              food_category: {},
            };

            foodData.cuisineTypes.forEach(cuisine => {
              newWeights.cuisine[cuisine] = initialWeightValue;
            });
            Object.keys(foodData.categories).forEach(group => {
              newWeights.food_group[group] = initialWeightValue;
              foodData.categories[group].forEach(category => {
                newWeights.food_category[category] = initialWeightValue;
              });
            });

            await setDoc(userDocRef, { weights: newWeights });
            setWeights(newWeights);
          }
        } catch (error: any) {
          console.error("Error accessing Firestore:", error);
          if (error.code === 'permission-denied') {
            console.error("⚠️ Firestore 권한이 없습니다. Firebase Console에서 Firestore 규칙을 확인하세요.");
          }
          // Continue without weights for now
          setWeights({
            cuisine: {},
            food_group: {},
            food_category: {},
          });
        }
      } else if (!currentUser) {
        clearUser();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setWeights, clearUser, foodData]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  if (loading || !foodData) {
    return (
      <nav className="bg-black-800 p-3 md:p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-lg md:text-2xl font-bold">맛집 찾기</div>
          <div className="h-8 w-20 md:h-10 md:w-32 bg-black-700 animate-pulse rounded"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-black px-4 py-3 text-white">
      <div className="flex justify-between items-center max-w-screen-xl mx-auto">
        {/* Logo - 모바일: M + TITLE, 데스크톱: 맛집 찾기 */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center md:hidden">
            <span className="text-black font-bold text-xl">M</span>
          </div>
          <span className="text-xl font-bold md:hidden">TITLE</span>
          <span className="hidden md:block text-lg md:text-2xl font-bold">맛집 찾기</span>
        </Link>

        {/* Mobile Icons */}
        <div className="flex items-center gap-4 md:hidden">
          {/* Recommendation Icon */}
          <Link href="/recommendation" className="hover:opacity-80">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"/>
            </svg>
          </Link>

          {/* Menu Icon */}
          <button className="hover:opacity-80">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* User Icon */}
          <Link href={user ? "/mypage" : "/login"} className="hover:opacity-80">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 4 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-2 md:gap-4">
          {user ? (
            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="hidden md:inline text-gray-300">{user.email}님</span>
              <Link href="/mypage" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-1.5 px-3 md:py-2 md:px-4 rounded text-sm md:text-base">
                마이페이지
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 md:py-2 md:px-4 rounded text-sm md:text-base"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-1.5 px-4 md:py-2 md:px-4 rounded-full text-sm md:text-base">
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
