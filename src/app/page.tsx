'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  // 사용자 인증 상태 확인
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 배경 색상 변경 효과
  useEffect(() => {
    document.body.classList.add('bg-gradient');
    return () => {
      document.body.classList.remove('bg-gradient');
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      
      // 미리보기 URL 생성
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    },
    maxFiles: 1
  });

  const handleNext = (type: 'ads' | 'content') => {
    if (file && preview) {
      // localStorage를 사용하여 이미지 URL 저장
      localStorage.setItem('uploadedImagePreview', preview);
      localStorage.setItem('creationType', type);
      
      // 선택한 유형에 따라 페이지 이동
      if (type === 'ads') {
        router.push('/ads/create');
      } else if (type === 'content') {
        // 콘텐츠 표지 만들기 페이지 경로 (수정 필요)
        router.push('/content/create'); // 예시 경로
      }
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthForm(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* 디자인 요소: 배경 블러 서클 */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-5xl opacity-10 animate-float"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-5xl opacity-10 animate-float" style={{animationDelay: '1s'}}></div>
      
      {/* 상단 네비게이션 */}
      <nav className="w-full z-10 flex justify-between items-center p-4 md:p-6">
        <div className="text-xl font-bold text-gradient">
          Mendle
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-sm font-medium text-gray-600 hover:bg-white transition-all shadow-sm"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthForm(true)}
              className="px-5 py-2 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-sm font-medium text-gray-600 hover:bg-white transition-all shadow-sm"
            >
              로그인
            </button>
          )}
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl px-4 md:px-8 py-10 z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-4 text-gradient">
          광고로 만들 사진을 올려주세요
        </h1>
        <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl">
          AI가 자동으로 사진을 보정하고 최적의 광고 문구를 만들어드려요
        </p>

        {/* 드래그 앤 드롭 영역 */}
        <div
          {...getRootProps()}
          className={`w-full glass-effect rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 
            ${isDragActive ? 'bg-indigo-50/50 border-indigo-300 shadow-lg scale-102' : 'hover:shadow-lg hover:scale-101'}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <input {...getInputProps()} />
          
          {preview ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-md overflow-hidden rounded-xl shadow-lg">
                <Image 
                  src={preview} 
                  alt="업로드된 이미지" 
                  width={500}
                  height={500}
                  className="w-full h-auto object-contain transition-transform hover:scale-105 duration-300" 
                  unoptimized 
                />
              </div>
              <p className="mt-6 text-gray-600">다른 이미지를 업로드하려면 클릭하거나 드래그하세요</p>
            </div>
          ) : (
            <div className="py-14 px-6">
              <div className={`relative w-24 h-24 mx-auto mb-6 transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
                <svg className="relative z-10 w-full h-full text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-xl font-medium text-gray-700 mb-3">클릭하거나 파일을 이 영역에 드래그하세요</p>
              <p className="text-sm text-gray-500">PNG, JPG, JPEG (최대 10MB)</p>
            </div>
          )}
        </div>

        {/* 선택 버튼 */}
        {preview && (
          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <button
              onClick={() => handleNext('ads')}
              disabled={!file}
              className={`w-full md:w-auto px-8 py-3 rounded-full text-white font-medium text-lg transition-all btn-gradient ${!file && 'opacity-70'}`}
            >
              광고 만들기
            </button>
            <button
              onClick={() => handleNext('content')}
              disabled={!file}
              className={`w-full md:w-auto px-8 py-3 rounded-full text-indigo-600 font-medium text-lg transition-all border border-indigo-200 bg-white/80 backdrop-blur-sm hover:bg-indigo-50 ${!file && 'opacity-70'}`}
            >
              콘텐츠 표지 만들기
            </button>
          </div>
        )}
        
        {/* 하단 설명 */}
        <p className="mt-8 text-sm text-gray-500 text-center max-w-md">
          Mendle은 AI가 자동으로 사진을 보정하고 광고 문구를 만들어주는 서비스입니다
        </p>
      </div>

      {/* 인증 모달 */}
      {showAuthForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <AuthForm onSuccess={handleAuthSuccess} />
          </div>
        </div>
      )}
    </main>
  );
}
