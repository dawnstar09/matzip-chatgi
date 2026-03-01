'use client';

import { useState, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  question?: string;
  options?: string[];
  recommendations?: string[];
}

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

// AI 응답 파싱 함수
function parseAIResponse(content: string): { question: string; options: string[]; recommendations: string[] } {
  const questionMatch = content.match(/\[질문\]\s*([\s\S]+?)(?=\[|$)/);
  const optionsMatch = content.match(/\[선택지\]\s*((?:-.+?\n?)+)/);
  const recommendationsMatch = content.match(/\[추천\]\s*([\s\S]+?)(?=\[|$)/);

  let question = questionMatch ? questionMatch[1].trim() : content;
  let options: string[] = [];
  
  // [선택지] 형식으로 파싱
  if (optionsMatch) {
    options = optionsMatch[1].split('\n').map(opt => opt.replace(/^-\s*/, '').trim()).filter(opt => opt);
  } else {
    // 번호 형식 (1. 2. 3. 또는 1) 2) 3)) 파싱
    const numberPattern = /^(\d+[\.\)]\s*.+)$/gm;
    const numberedOptions = content.match(numberPattern);
    if (numberedOptions && numberedOptions.length >= 2) {
      options = numberedOptions.map(opt => opt.replace(/^\d+[\.\)]\s*/, '').trim()).filter(opt => opt);
      // 질문과 선택지 분리
      const lines = content.split('\n');
      const firstOptionIndex = lines.findIndex(line => /^\d+[\.\)]/.test(line));
      if (firstOptionIndex > 0) {
        question = lines.slice(0, firstOptionIndex).join('\n').trim();
      }
    } else {
      // 쉼표나 '중에서' 키워드로 구분된 선택지 파싱
      const commaPattern = /([가-힣\w]+)(?:,|、|\s*,\s*)/g;
      const matches = content.match(commaPattern);
      if (matches && matches.length >= 2) {
        options = matches.map(m => m.replace(/[,、\s]+$/, '').trim()).filter(opt => opt && opt.length > 1);
        // 마지막 선택지는 '중에서' 앞에 있을 수 있음
        const lastOption = content.match(/,\s*([가-힣\w]+)\s*중에서/);
        if (lastOption && !options.includes(lastOption[1])) {
          options.push(lastOption[1]);
        }
      }
      // 여전히 없으면 기본 선택지 생성
      if (options.length === 0) {
        // 질문 내용에서 음식 종류 키워드 찾기
        const foodTypes = ['한식', '일식', '양식', '중식', '아시아', '분식', '패스트푸드', '카페'];
        const found = foodTypes.filter(type => content.includes(type));
        if (found.length >= 2) {
          options = found;
        }
      }
    }
  }
  
  const recommendations = recommendationsMatch
    ? recommendationsMatch[1].split(',').map(r => r.trim()).filter(r => r)
    : [];

  return { question, options, recommendations };
}

export default function FoodGameClient() {
  const [foodData, setFoodData] = useState<FoodData>({ categories: {}, cuisineTypes: [], menus: [] });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [recommendedMenus, setRecommendedMenus] = useState<string[]>([]);

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

  // 데이터 로딩 완료 후 자동으로 게임 시작
  useEffect(() => {
    if (!dataLoading && foodData.menus.length > 0 && chatMessages.length === 0) {
      startFoodGame();
    }
  }, [dataLoading, foodData]);

  const startFoodGame = async () => {
    setChatMessages([]);
    setSelectedOptions([]);
    setChatLoading(true);

    try {
      const response = await fetch('/api/food-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '음식 추천을 시작해줘!' }],
          foodData: {
            cuisineTypes: foodData.cuisineTypes,
            categories: foodData.categories,
            menus: foodData.menus,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🤖 AI 응답:', data.message);
        const parsed = parseAIResponse(data.message);
        console.log('📋 파싱 결과:', parsed);
        setChatMessages([{ 
          role: 'assistant', 
          content: data.message,
          question: parsed.question,
          options: parsed.options,
          recommendations: parsed.recommendations
        }]);
      } else {
        setChatMessages([{ role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' }]);
      }
    } catch (error) {
      console.error('Food game error:', error);
      setChatMessages([{ role: 'assistant', content: '연결 오류가 발생했습니다.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleOption = (option: string) => {
    setSelectedOptions(prev => 
      prev.includes(option) 
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  const sendSelectedOptions = async () => {
    if (selectedOptions.length === 0) return;

    const userMessage = selectedOptions.join(', ');
    const newMessage: ChatMessage = { role: 'user', content: userMessage };
    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    setSelectedOptions([]);
    setChatLoading(true);

    try {
      const response = await fetch('/api/food-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          foodData: {
            cuisineTypes: foodData.cuisineTypes,
            categories: foodData.categories,
            menus: foodData.menus,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🤖 AI 응답:', data.message);
        const parsed = parseAIResponse(data.message);
        console.log('📋 파싱 결과:', parsed);
        
        // 추천 메뉴가 있으면 리스트에 추가
        if (parsed.recommendations.length > 0) {
          setRecommendedMenus(prev => [...prev, ...parsed.recommendations]);
        } else if (parsed.options.length > 0 && foodData.menus.length > 0) {
          // 선택지가 있으면 추측을 통해 일부 메뉴 추가
          const matchedMenus = foodData.menus
            .filter((menu: Menu) => {
              const userAnswers = userMessage.toLowerCase();
              return userAnswers.includes(menu.cuisine.toLowerCase()) ||
                     userAnswers.includes(menu.group.toLowerCase()) ||
                     userAnswers.includes(menu.category.toLowerCase());
            })
            .slice(0, 1)
            .map((m: Menu) => m.name);
          if (matchedMenus.length > 0) {
            setRecommendedMenus(prev => [...prev, ...matchedMenus]);
          }
        }
        
        setChatMessages([...updatedMessages, { 
          role: 'assistant', 
          content: data.message,
          question: parsed.question,
          options: parsed.options,
          recommendations: parsed.recommendations
        }]);
      } else {
        setChatMessages([...updatedMessages, { role: 'assistant', content: '오류가 발생했습니다.' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages([...updatedMessages, { role: 'assistant', content: '연결 오류가 발생했습니다.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const resetGame = () => {
    setChatMessages([]);
    setSelectedOptions([]);
    setRecommendedMenus([]);
    // 게임을 다시 시작
    startFoodGame();
  };

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-2xl md:text-3xl font-bold text-purple-900">
            음식 아키네이터 🍽️
          </div>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-white/80 backdrop-blur text-purple-700 rounded-lg hover:bg-white font-semibold transition shadow"
          >
            다시 시작
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 캐릭터와 질문 */}
          <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-3xl shadow-2xl p-6 md:p-8">
            {/* 캐릭터 */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-48 h-48 md:w-56 md:h-56 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full flex items-center justify-center shadow-2xl border-8 border-white">
                  <div className="text-8xl md:text-9xl">🍚</div>
                </div>
                {/* 장식 요소 */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-red-400 rounded-full shadow-lg"></div>
                <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-blue-400 rounded-full shadow-lg"></div>
              </div>
            </div>

            {/* 로딩 상태 */}
            {chatLoading && (
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 text-center">
                <div className="flex justify-center space-x-3 mb-4">
                  <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-gray-600 font-medium">생각하는 중...</p>
              </div>
            )}

            {/* 질문과 선택지 */}
            {!chatLoading && chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === 'assistant' && (
              <div className="space-y-4">
                {/* 질문 말풍선 */}
                <div className="relative bg-gradient-to-br from-teal-700 to-teal-800 text-white p-6 rounded-2xl shadow-xl">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[20px] border-b-teal-700"></div>
                  <div className="flex items-start gap-2">
                    <div className="text-3xl">💬</div>
                    <p className="text-lg md:text-xl font-medium flex-1">
                      {chatMessages[chatMessages.length - 1].question || chatMessages[chatMessages.length - 1].content}
                    </p>
                  </div>
                </div>

                {/* 선택지 영역 */}
                {chatMessages[chatMessages.length - 1].options && 
                 chatMessages[chatMessages.length - 1].options!.length > 0 && (
                  <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6">
                    <p className="text-sm text-gray-600 font-medium mb-3">✨ 해당되는 것을 선택해주세요!</p>
                    <div className="space-y-3">
                      {chatMessages[chatMessages.length - 1].options!.map((option, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => toggleOption(option)}
                          className={`w-full px-6 py-4 rounded-xl font-semibold text-base md:text-lg transition-all transform hover:scale-102 hover:shadow-lg ${
                            selectedOptions.includes(option)
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg border-4 border-purple-400'
                              : 'bg-gray-100 text-gray-800 border-4 border-gray-300 hover:border-purple-300 hover:bg-gray-200'
                          }`}
                        >
                          {selectedOptions.includes(option) && '✓ '}
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 오른쪽: 추천 메뉴 */}
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>🍽️</span>
              <span>오늘의 추천 메뉴</span>
            </h2>

            {recommendedMenus.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-6xl mb-4">🤔</div>
                <p className="text-gray-500 text-lg">
                  질문에 답하면<br />
                  딱 맞는 음식을 추천해드려요!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendedMenus.map((menu, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-5 transform hover:scale-105 transition-all shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                          {menu}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 추천 결과 */}
            {chatMessages.length > 0 && 
             chatMessages[chatMessages.length - 1].recommendations && 
             chatMessages[chatMessages.length - 1].recommendations!.length > 0 && (
              <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-4 border-yellow-400 rounded-2xl p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-700 mb-3">🎉 완벽한 메뉴를 찾았어요!</p>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                    {chatMessages[chatMessages.length - 1].recommendations!.join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 선택 완료 버튼 */}
        {selectedOptions.length > 0 && !chatLoading && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <button
              onClick={sendSelectedOptions}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-lg hover:from-purple-700 hover:to-pink-700 shadow-2xl transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>선택 완료</span>
              <span className="bg-white text-purple-600 px-3 py-1 rounded-full font-black">
                {selectedOptions.length}
              </span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
