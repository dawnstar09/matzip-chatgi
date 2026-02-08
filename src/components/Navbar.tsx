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
      <nav className="bg-black-800 p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold">맛집 찾기</div>
          <div className="h-10 w-32 bg-black-700 animate-pulse rounded"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-black p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:text-gray-300">
          맛집 찾기
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">{user.email}님</span>
              <Link href="/mypage" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                마이페이지
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-full">
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
