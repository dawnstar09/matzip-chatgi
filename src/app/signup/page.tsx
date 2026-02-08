'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Firebase Authentication으로 회원가입
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 사용자 프로필에 아이디 설정
      await updateProfile(userCredential.user, {
        displayName: userId,
      });

      console.log('회원가입 성공:', userCredential.user);
      alert('회원가입이 완료되었습니다!');
      router.push('/login');
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      
      // Firebase 에러 메시지 처리
      if (error.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (error.code === 'auth/weak-password') {
        setError('비밀번호는 최소 6자 이상이어야 합니다.');
      } else if (error.code === 'auth/invalid-email') {
        setError('유효하지 않은 이메일 형식입니다.');
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col">
      {/* Navigation Bar */}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-12 w-full max-w-md">
          <h1 className="text-4xl font-bold text-center mb-12 text-gray-900">
            회원가입
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력해주세요."
                className="w-full px-6 py-4 bg-gray-100 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            {/* 아이디 */}
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                아이디
              </label>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="아이디를 입력해주세요."
                className="w-full px-6 py-4 bg-gray-100 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력해주세요."
                className="w-full px-6 py-4 bg-gray-100 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-full transition-colors duration-200 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : '계정 생성하기'}
            </button>
          </form>

          {/* 로그인 링크 */}
          <p className="text-center mt-8 text-sm text-gray-600">
            이미 계정을 가지고 계십니까?{' '}
            <Link href="/login" className="text-yellow-600 hover:text-yellow-700 font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
