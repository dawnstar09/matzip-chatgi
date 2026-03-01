'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useUserStore from '@/store/userStore';
import Link from 'next/link';

// 데이터 구조에 대한 타입 정의
interface Menu {
  name: string;
  group: string;
  category: string;
  cuisine: string;
}

interface FoodData {
  categories: Record<string, string[]>;
  cuisineTypes: string[];
  menus: Menu[];
}

// Weighting constants
const learningRate = 0.05;
const minWeight = 0.1;
const maxWeight = 2.0;

export default function RecommendationClient() {
  // 상태 관리
  const { user, weights, setWeights } = useUserStore(); // Get user and weights from store
  const [foodData, setFoodData] = useState<FoodData>({ categories: {}, cuisineTypes: [], menus: [] });
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCuisineType, setSelectedCuisineType] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null); // New state for user rating
  const [noRecommendationFound, setNoRecommendationFound] = useState(false); // New state for no recommendation

  // 데이터 로딩
  useEffect(() => {
    fetch('/data/food_data.json')
      .then((res) => res.json())
      .then((data) => {
        setFoodData(data);
        setDataLoading(false);
      })
      .catch(err => {
        console.error("Failed to load food data:", err);
        setDataLoading(false);
      });
  }, []);

  // 핸들러 함수

  const handleGroupSelect = (group: string) => {
    setSelectedGroup((prevGroup) => (prevGroup === group ? null : group));
    setSelectedCategory(null); // 상위 카테고리 변경 시 하위 카테고리 선택 초기화
    setRecommendation(null);
    setUserRating(null);
    setNoRecommendationFound(false); // Reset no recommendation message
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory((prevCategory) => (prevCategory === category ? null : category));
    setRecommendation(null);
    setUserRating(null);
    setNoRecommendationFound(false); // Reset no recommendation message
  }

  const handleCuisineTypeSelect = (cuisine: string) => {
    setSelectedCuisineType((prevCuisine) => (prevCuisine === cuisine ? null : cuisine));
    setRecommendation(null);
    setUserRating(null);
    setNoRecommendationFound(false); // Reset no recommendation message
  }

  const calculateWeightedRandom = (filteredMenus: Menu[], currentWeights: typeof weights) => {
    let totalWeight = 0;
    const weightedMenus = filteredMenus.map(menu => {
      const cuisineWeight = currentWeights.cuisine[menu.cuisine] || 1.0;
      const groupWeight = currentWeights.food_group[menu.group] || 1.0;
      const categoryWeight = currentWeights.food_category[menu.category] || 1.0;

      const score = cuisineWeight * groupWeight * categoryWeight;
      totalWeight += score;
      return { menu, score };
    });

    // 디버깅: 가중치 계산 로그
    console.log('=== 가중치 기반 추천 시작 ===');
    console.log('총 필터링된 메뉴 수:', filteredMenus.length);
    console.log('총 가중치 합계:', totalWeight);
    console.log('상위 5개 메뉴 점수:', weightedMenus.slice(0, 5).map(wm => ({ name: wm.menu.name, score: wm.score.toFixed(3) })));

    // If all scores are 0 (e.g., all weights are 0), fall back to uniform random
    if (totalWeight === 0) {
        return filteredMenus[Math.floor(Math.random() * filteredMenus.length)];
    }

    let random = Math.random() * totalWeight;
    for (let i = 0; i < weightedMenus.length; i++) {
      if (random < weightedMenus[i].score) {
        return weightedMenus[i].menu;
      }
      random -= weightedMenus[i].score;
    }
    // Fallback in case of floating point issues, should not be reached
    return filteredMenus[Math.floor(Math.random() * filteredMenus.length)];
  };

  const handleRecommend = () => {
    setLoading(true);
    setRecommendation(null);
    setUserRating(null);
    setNoRecommendationFound(false); // Reset no recommendation message

    let filteredMenus = foodData.menus;

    // 필터링 로직: 선택된 항목이 있을 경우에만 필터링 적용
    if (selectedGroup) {
      filteredMenus = filteredMenus.filter((menu) => menu.group === selectedGroup);
    }
    if (selectedCategory) {
      filteredMenus = filteredMenus.filter((menu) => menu.category === selectedCategory);
    }
    if (selectedCuisineType) {
      filteredMenus = filteredMenus.filter((menu) => menu.cuisine === selectedCuisineType);
    }

    setTimeout(() => {
      if (filteredMenus.length > 0) {
        const recommendedMenu = user ? calculateWeightedRandom(filteredMenus, weights) : filteredMenus[Math.floor(Math.random() * filteredMenus.length)];
        setRecommendation(recommendedMenu);
      } else {
        setRecommendation(null); // Set to null if no menu found
        setNoRecommendationFound(true); // Show no recommendation message
      }
      setLoading(false);
    }, 1000);
  };

  const handleRatingSubmit = async (rating: number) => {
    if (!user || !recommendation) return;

    setUserRating(rating);

    const adjustmentFactor = (rating - 5.5) / 4.5; // Maps 1-10 to approx -1 to 1
    const newWeights = { ...weights };

    console.log('=== 가중치 업데이트 시작 ===');
    console.log('평가 점수:', rating);
    console.log('조정 계수:', adjustmentFactor.toFixed(3));
    console.log('학습률:', learningRate);

    // Update cuisine weight
    if (recommendation.cuisine) {
      const currentWeight = newWeights.cuisine[recommendation.cuisine] || 1.0;
      const newWeight = Math.max(minWeight, Math.min(maxWeight, currentWeight + learningRate * adjustmentFactor));
      console.log(`${recommendation.cuisine}: ${currentWeight.toFixed(3)} → ${newWeight.toFixed(3)}`);
      newWeights.cuisine[recommendation.cuisine] = newWeight;
    }

    // Update food_group weight
    if (recommendation.group) {
      const currentWeight = newWeights.food_group[recommendation.group] || 1.0;
      const newWeight = Math.max(minWeight, Math.min(maxWeight, currentWeight + learningRate * adjustmentFactor));
      console.log(`${recommendation.group}: ${currentWeight.toFixed(3)} → ${newWeight.toFixed(3)}`);
      newWeights.food_group[recommendation.group] = newWeight;
    }

    // Update food_category weight
    if (recommendation.category) {
      const currentWeight = newWeights.food_category[recommendation.category] || 1.0;
      const newWeight = Math.max(minWeight, Math.min(maxWeight, currentWeight + learningRate * adjustmentFactor));
      console.log(`${recommendation.category}: ${currentWeight.toFixed(3)} → ${newWeight.toFixed(3)}`);
      newWeights.food_category[recommendation.category] = newWeight;
    }

    setWeights(newWeights); // Update Zustand store

    // Persist to Firestore
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { weights: newWeights });
      alert('평가가 반영되었습니다!');
    } catch (error: any) {
      console.error("Error updating weights in Firestore:", error);
      if (error.code === 'permission-denied') {
        alert('⚠️ Firestore 권한 오류: Firebase Console에서 Firestore 규칙을 확인해주세요.');
      } else {
        alert('평가 반영 중 오류가 발생했습니다.');
      }
    }
  };

  // 로딩 및 데이터 없음 UI
  if (dataLoading) {
    return <div className="text-center p-8">데이터를 불러오는 중입니다...</div>;
  }
  if (foodData.menus.length === 0) {
    return <div className="text-center p-8">메뉴 데이터를 불러오지 못했습니다.</div>;
  }

  // 메인 UI 렌더링
  return (
    <div className="w-full max-w-3xl p-4 md:p-8 space-y-6 md:space-y-8 bg-white rounded-lg shadow-2xl">
      <div className="text-center">
        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900">오늘 저녁 뭐 먹지?</h1>
        <p className="mt-2 text-sm md:text-lg text-gray-600">원하는 분류를 선택하고 메뉴를 추천받으세요!</p>
      </div>

      {/* 1단계: Cuisine Type 선택 (새로운 상위 분류) */}
      <div className="p-3 md:p-4 border rounded-lg">
        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4 text-center">1. 음식 종류 선택</h3>
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {foodData.cuisineTypes.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => handleCuisineTypeSelect(cuisine)}
              className={`px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base font-medium rounded-full transition-all duration-200 ease-in-out
                ${selectedCuisineType === cuisine
                  ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 hover:shadow-md'
                }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>

      {/* 2단계: Food Group 선택 */}
      <div className="p-3 md:p-4 border rounded-lg">
        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4 text-center">2. 큰 분류 선택</h3>
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {Object.keys(foodData.categories).map((group) => (
            <button
              key={group}
              onClick={() => handleGroupSelect(group)}
              className={`px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base font-medium rounded-full transition-all duration-200 ease-in-out
                ${selectedGroup === group
                  ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 hover:shadow-md'
                }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* 3단계: Food Category 선택 */}
      {selectedGroup && ( 
        <div className="p-3 md:p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4 text-center">3. 세부 분류 선택</h3>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {foodData.categories[selectedGroup]?.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base font-medium rounded-full transition-all duration-200 ease-in-out
                  ${selectedCategory === category
                    ? 'bg-teal-500 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:shadow-md'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 추천 버튼 */}
      <div className="flex flex-col md:flex-row gap-3">
        <button
          onClick={handleRecommend}
          disabled={loading}
          className="flex-1 px-4 py-3 md:py-4 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-base md:text-xl shadow-lg"
        >
          {loading ? '고민 중...' : '메뉴 추천받기!'}
        </button>
        
        {recommendation && (
          <button
            onClick={() => {
              const searchUrl = `https://map.naver.com/v5/search/${encodeURIComponent(recommendation.name)}`;
              window.open(searchUrl, '_blank');
            }}
            className="flex-1 px-4 py-3 md:py-4 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 text-base md:text-xl shadow-lg"
          >
            주변 음식점 찾기
          </button>
        )}
      </div>

      {/* 결과 표시 */}
      {loading && (
        <div className="flex justify-center items-center pt-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {noRecommendationFound && !loading && (
        <div className="p-4 md:p-8 mt-4 md:mt-6 bg-red-50 rounded-lg border border-red-200 text-center shadow-inner">
          <p className="text-base md:text-xl font-semibold text-red-700">선택하신 조건에 맞는 추천 메뉴가 없어요 😥</p>
        </div>
      )}

      {recommendation && ( // Only show recommendation and rating if a valid menu is recommended
        <div className="p-4 md:p-8 mt-4 md:mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-gray-200 text-center shadow-inner">
          <h2 className="text-lg md:text-2xl font-semibold text-gray-800">오늘의 추천 메뉴는...</h2>
          <div className="mt-4">
            <p className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">{recommendation.name}</p>
            <p className="mt-3 text-sm md:text-base text-gray-500">
              {recommendation.cuisine && `(${recommendation.cuisine} > `}
              {recommendation.group && `${recommendation.group} > `}
              {recommendation.category && `${recommendation.category})`}
            </p>
          </div>

          {/* Rating UI */}
          {user && ( // Only show rating if user is logged in
            <div className="mt-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-2">이 메뉴는 어떠셨나요? (1-10점)</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleRatingSubmit(score)}
                    className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base
                      ${userRating === score ? 'bg-yellow-500' : 'bg-gray-400 hover:bg-gray-500'}
                    `}
                  >
                    {score}
                  </button>
                ))}
              </div>
              {userRating && <p className="mt-2 text-sm text-gray-600">선택하신 점수: {userRating}점</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
