import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 대전광역시 빅데이터 음식점 API 호출
    const response = await fetch('https://bigdata.daejeon.go.kr/api/stores/', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('음식점 데이터 가져오기 실패:', error);
    return NextResponse.json(
      { error: '음식점 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
