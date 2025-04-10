'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ContentType, contentStyles } from '@/lib/contentStyles';
import html2canvas from 'html2canvas';
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, RefreshCwIcon, EditIcon } from 'lucide-react';
import { useMessage } from '@/components/MessageContext';
import { supabase } from '@/lib/supabase';
import { generateContent } from '@/lib/geminiUtils';

export default function CreateContent() {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [contentType, setContentType] = useState<ContentType>('reels');
  const [selectedStyle, setSelectedStyle] = useState<string>('style1');
  const [accountName, setAccountName] = useState('');
  const [contentText, setContentText] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const { showMessage } = useMessage();

  // 이미지 가져오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedImagePreview = localStorage.getItem('uploadedImagePreview');
      
      if (savedImagePreview) {
        setImagePreview(savedImagePreview);
      } else {
        // 업로드된 이미지가 없으면 홈으로 리다이렉트
        router.push('/');
      }
    }
  }, [router]);

  // 사용자 정보 가져오기
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

  // 콘텐츠 텍스트 입력 시 제목 생성
  useEffect(() => {
    if (contentText.length > 5) {
      // 제목이 잘리지 않도록 전체 텍스트를 사용합니다
      setGeneratedTitle(contentText);
    }
  }, [contentText]);

  // 현재 선택된 스타일 정보 가져오기
  const currentStyle = contentStyles.find(style => style.id === selectedStyle) || contentStyles[0];

  // 다음 단계로 이동
  const goToNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 이전 단계로 이동
  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 이미지 다운로드
  const handleDownload = async () => {
    if (!previewRef.current) return;

    setIsLoading(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        width: previewRef.current.offsetWidth,
        height: previewRef.current.offsetHeight,
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${accountName}-content-cover.png`;
      link.click();
      
      showMessage('이미지가 다운로드되었습니다');
    } catch (error) {
      console.error('다운로드 중 오류 발생:', error);
      showMessage('다운로드 중 오류가 발생했습니다', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 스타일 클래스 계산
  const getTextStyleClasses = () => {
    let classes = 'absolute p-4 max-w-[90%] transition-all duration-300 z-20';
    
    // Text position
    if (currentStyle.textPosition === 'top') {
      classes += ' top-4';
    } else if (currentStyle.textPosition === 'center') {
      classes += ' top-1/2 -translate-y-1/2';
    } else {
      classes += ' bottom-4';
    }
    
    // Text alignment
    if (currentStyle.textAlign === 'left') {
      classes += ' left-4 text-left';
    } else if (currentStyle.textAlign === 'center') {
      classes += ' left-1/2 -translate-x-1/2 text-center w-[85%]';
    } else {
      classes += ' right-4 text-right';
    }
    
    // Account position
    if (currentStyle.accountPosition === 'top') {
      classes += ' flex flex-col';
    } else {
      classes += ' flex flex-col-reverse';
    }
    
    return classes;
  };

  // Add a function to balance text
  const balanceText = (text: string): React.ReactNode => {
    const words = text.split(' ');
    const mid = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, mid).join(' ');
    const secondLine = words.slice(mid).join(' ');
    return (
      <>
        <span>{firstLine}</span>
        <br />
        <span>{secondLine}</span>
      </>
    );
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-medium">콘텐츠 표지 만들기</h1>
          <button
            onClick={handleDownload}
            disabled={isLoading}
            className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            <DownloadIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* 진행 단계 표시 */}
        <div className="w-full bg-gray-100 h-1">
          <div 
            className="bg-indigo-600 h-1 transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          ></div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1">
        {/* 미리보기 영역 */}
        <div className="w-full md:w-1/2 bg-gray-900 flex items-center justify-center p-4">
          {imagePreview && (
            <div 
              ref={previewRef}
              className="relative overflow-hidden shadow-xl"
              style={{
                width: contentType === 'reels' ? '300px' : '320px',
                height: contentType === 'reels' ? '530px' : '400px',
                maxWidth: '100%'
              }}
            >
              <Image
                src={imagePreview}
                alt="콘텐츠 표지"
                className="object-cover"
                layout="fill"
                unoptimized
              />
              
              {/* 오버레이 */}
              <div 
                className="absolute inset-0" 
                style={{ 
                  backgroundColor: currentStyle.overlayColor,
                  opacity: currentStyle.overlayOpacity
                }}
              ></div>
              
              {/* 오버레이 이미지 */}
              {currentStyle.overlayImage && (
                <div className="absolute inset-0 z-10">
                  <Image
                    src={currentStyle.overlayImage}
                    alt="Overlay effect"
                    layout="fill"
                    objectFit="cover"
                    unoptimized
                  />
                </div>
              )}
              
              {/* 테두리 */}
              {currentStyle.border && (
                <div className="absolute inset-0 border-2 border-white m-[8px] z-10"></div>
              )}
              
              {/* 텍스트 영역 */}
              <div className={getTextStyleClasses()}>
                {accountName && (
                  <div 
                    className={`text-sm font-medium opacity-90 ${
                      currentStyle.accountPosition === 'top' 
                        ? 'mb-0' 
                        : 'mt-0'
                    }`}
                    style={{ 
                      color: currentStyle.textColor,
                      fontFamily: currentStyle.fontStyle
                    }}
                  >
                    @{accountName}
                  </div>
                )}
                
                {generatedTitle && (
                  <h2 
                    className="text-2xl md:text-3xl font-bold leading-tight"
                    style={{ 
                      color: currentStyle.textColor,
                      fontFamily: currentStyle.fontStyle,
                      width: '100%'
                    }}
                  >
                    {generatedTitle}
                  </h2>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* 입력/선택 영역 */}
        <div className="w-full md:w-1/2 p-6 overflow-y-auto">
          <div className="max-w-md mx-auto">
            {/* 스텝 1: 콘텐츠 유형 선택 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">콘텐츠 유형 선택</h2>
                <p className="text-gray-600">만들고 싶은 콘텐츠 형식을 선택해주세요.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setContentType('reels')}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center transition-all ${
                      contentType === 'reels' 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-24 h-40 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                      <span className="text-xs text-gray-500">9:16</span>
                    </div>
                    <span className="font-medium">릴스</span>
                  </button>
                  
                  <button
                    onClick={() => setContentType('card')}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center transition-all ${
                      contentType === 'card' 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-32 h-40 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                      <span className="text-xs text-gray-500">4:5</span>
                    </div>
                    <span className="font-medium">카드뉴스</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* 스텝 2: 스타일 선택 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">스타일 선택</h2>
                <p className="text-gray-600">콘텐츠 표지 스타일을 선택해주세요.</p>
                
                <div className="grid grid-cols-1 gap-4">
                  {contentStyles.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedStyle === style.id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center overflow-hidden">
                          <Image 
                            src={style.previewImage} 
                            alt={style.name}
                            width={64}
                            height={64}
                            unoptimized
                          />
                        </div>
                        <div className="ml-4 text-left">
                          <h3 className="font-medium">{style.name}</h3>
                          <p className="text-sm text-gray-500">{style.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* 스텝 3: 계정명 입력 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">계정명 입력</h2>
                <p className="text-gray-600">표지에 표시될 계정명을 입력해주세요.</p>
                
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">@</span>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="계정명"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
            
            {/* 스텝 4: 콘텐츠 내용 입력 */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">콘텐츠 내용 입력</h2>
                <p className="text-gray-600">콘텐츠의 주요 내용을 입력해주세요. 이를 바탕으로 제목이 생성됩니다.</p>
                
                <textarea
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="콘텐츠의 주요 내용을 입력하세요"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-32"
                />
              </div>
            )}
            
            {/* 스텝 5: 제목 검토 및 수정 */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">제목 검토</h2>
                <p className="text-gray-600">생성된 제목을 확인하고 필요한 경우 수정해주세요.</p>
                
                <div className="relative">
                  {isEditingTitle ? (
                    <input
                      type="text"
                      value={generatedTitle}
                      onChange={(e) => setGeneratedTitle(e.target.value)}
                      autoFocus
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      onBlur={() => setIsEditingTitle(false)}
                    />
                  ) : (
                    <div className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 flex justify-between items-center">
                      <span>{generatedTitle}</span>
                      <button 
                        onClick={() => setIsEditingTitle(true)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={handleDownload}
                    disabled={isLoading}
                    className="w-full py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCwIcon className="w-5 h-5 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <DownloadIcon className="w-5 h-5" />
                        이미지 다운로드
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 하단 네비게이션 */}
      <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 p-4">
        <div className="flex justify-between max-w-md mx-auto">
          <button
            onClick={goToPrevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 rounded-lg border border-gray-300 flex items-center gap-1 text-gray-700 disabled:opacity-50"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            이전
          </button>
          
          {currentStep < 5 ? (
            <button
              onClick={goToNextStep}
              className="px-6 py-2 rounded-lg bg-indigo-600 text-white flex items-center gap-1"
            >
              다음
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 rounded-lg bg-gray-800 text-white flex items-center gap-1"
            >
              완료
            </button>
          )}
        </div>
      </div>
    </main>
  );
} 