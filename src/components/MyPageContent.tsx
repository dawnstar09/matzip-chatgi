'use client';

import useUserStore from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MyPageContent() {
  const { user, weights } = useUserStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsChecking(false);
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (isChecking) {
    return (
      <div className="w-full max-w-2xl p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Helper to render weight categories
  const renderWeights = (weightMap: Record<string, number>) => {
    if (Object.keys(weightMap).length === 0) {
      return <p className="text-gray-600">아직 가중치 데이터가 없습니다.</p>;
    }
    return (
      <ul className="list-disc list-inside space-y-1">
        {Object.entries(weightMap)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort alphabetically
          .map(([key, value]) => (
            <li key={key} className="text-gray-700">
              <span className="font-medium">{key}:</span> {value.toFixed(3)}
            </li>
          ))}
      </ul>
    );
  };

  return (
    <div className="w-full max-w-2xl p-8 space-y-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 text-center">내 가중치 설정</h2>

      <div className="border p-4 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">음식 종류 (Cuisine)</h3>
        {renderWeights(weights.cuisine)}
      </div>

      <div className="border p-4 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">큰 분류 (Food Group)</h3>
        {renderWeights(weights.food_group)}
      </div>

      <div className="border p-4 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">세부 분류 (Food Category)</h3>
        {renderWeights(weights.food_category)}
      </div>

      <p className="text-sm text-gray-500 text-center mt-4">
        가중치는 메뉴 추천에 대한 당신의 평가에 따라 자동으로 조정됩니다.
      </p>
    </div>
  );
}
