import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI API 초기화
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface FoodGameRequest {
  messages: Message[];
  foodData: {
    cuisineTypes: string[];
    categories: Record<string, string[]>;
    menus: Array<{ name: string; group: string; category: string; cuisine: string }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 체크
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다. .env.local 파일을 확인하고 서버를 재시작해주세요.' },
        { status: 500 }
      );
    }

    console.log('✅ OpenAI API Key loaded');

    const body: FoodGameRequest = await request.json();
    const { messages, foodData } = body;

    console.log('📨 Received messages:', messages.length);

    // 시스템 프롬프트 생성
    const systemPrompt = `당신은 음식 추천 전문가이며, 아키네이터처럼 질문을 통해 사용자가 원하는 음식을 찾아주는 AI입니다.

사용 가능한 음식 데이터:
- 음식 종류: ${foodData.cuisineTypes.join(', ')}
- 큰 분류: ${Object.keys(foodData.categories).join(', ')}
- 총 ${foodData.menus.length}개의 메뉴

규칙:
1. 한 번에 하나의 질문만 하세요
2. 질문은 짧고 친근하게 (~니?, ~해? 형태)
3. 질문 후 반드시 선택지를 제공하세요
4. 답변 형식을 정확히 지켜주세요:

[질문] 질문 내용
[선택지]
- 선택지1
- 선택지2  
- 선택지3
[추천] 메뉴명1, 메뉴명2

예시:
[질문] 오늘 어떤 음식이 땡기니?
[선택지]
- 매운 음식
- 국물 있는 음식
- 고기 요리
- 면 요리
[추천] 김치찌개, 된장찌개

5. 추천 음식은 반드시 제공된 메뉴 리스트에서 선택
6. 선택지는 2-5개 정도로 제공
7. 답변은 200자 이내로 간결하게

사용자가 선택한 답변을 바탕으로 다음 질문을 해주세요.`;

    // 메시지 배열 구성
    const chatMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: chatMessages,
      max_tokens: 300,
      temperature: 0.8,
    });

    const aiResponse = completion.choices[0].message.content || '질문을 생성하는데 실패했습니다.';

    console.log('✅ AI Response generated successfully');
    return NextResponse.json({ message: aiResponse });
  } catch (error: any) {
    console.error('❌ OpenAI API Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error status:', error.status);
    
    return NextResponse.json(
      { 
        error: '음식 추천 중 오류가 발생했습니다.', 
        details: error.message,
        code: error.code || error.status || 'UNKNOWN',
        hint: 'OpenAI API 키를 https://platform.openai.com/api-keys 에서 발급받아 .env.local에 설정해주세요.'
      },
      { status: 500 }
    );
  }
}
