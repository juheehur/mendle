'use client';

import { useEffect, useState, useRef, ChangeEvent, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { enhanceImage, imageFilters } from '@/lib/imageUtils';
import { generateAdCopy } from '@/lib/geminiUtils';
import { downloadImage } from '@/lib/downloadUtils';
import { useMessage } from '@/components/MessageContext';
import AuthForm from '@/components/AuthForm';
import EditAdCopy from '@/components/EditAdCopy';
import type { AdCopy as AdCopyType } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { 
  ImageIcon,
  Loader2Icon,
  SunIcon,
  SparklesIcon,
  MoveVerticalIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon
} from 'lucide-react';

type Message = {
  id: number;
  text: string;
  isUser: boolean;
  options?: string[]; // 다중 선택 옵션
};

type ImageCategory = keyof typeof imageFilters | null;

type AdCopy = {
  mainCopy: string;
  subCopy: string;
};

// 이미지 형식 타입
type ImageFormat = 'blog' | 'reels' | 'ad' | null;

const INITIAL_QUESTION = '상호명이 어떻게 되세요?';
const CATEGORY_OPTIONS = Object.keys(imageFilters);
const FORMAT_OPTIONS = ['블로그/인스타 표지', '릴스 표지', '광고소재'];

export default function CreateAd() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: INITIAL_QUESTION, isUser: false },
  ]);
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [highlightPoint, setHighlightPoint] = useState('');
  const [adCopy, setAdCopy] = useState<AdCopy>({
    mainCopy: '',
    subCopy: ''
  });
  const [step, setStep] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory>(null);
  const [selectedFormat, setSelectedFormat] = useState<ImageFormat>(null);
  const [textPositionAdjustment, setTextPositionAdjustment] = useState(0);
  const [imageBrightness, setImageBrightness] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showMessage } = useMessage();
  const randomBackground = useMemo(() => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD']
    return colors[Math.floor(Math.random() * colors.length)]
  }, [])
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [savedAdCopy, setSavedAdCopy] = useState<AdCopyType | null>(null);

  // 이미지 가져오기 및 보정 시작
  useEffect(() => {
    // 브라우저 환경에서만 실행
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

  // 카테고리가 선택되면 이미지 보정 실행
  useEffect(() => {
    if (imagePreview && selectedCategory) {
      setIsProcessing(true);
      enhanceImage(imagePreview, selectedCategory, selectedFormat)
        .then(enhancedUrl => {
          setEnhancedImage(enhancedUrl);
          setIsProcessing(false);
        })
        .catch(error => {
          console.error('이미지 보정 중 오류 발생:', error);
          setIsProcessing(false);
        });
    }
  }, [imagePreview, selectedCategory, selectedFormat]);

  // 메시지 영역 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // 새 메시지가 들어올 때마다 input에 포커스
    inputRef.current?.focus();
  }, [messages]);

  // 모든 정보가 수집되면 광고 카피 생성
  const generateCopyIfComplete = async () => {
    if (
      step === 7 && 
      businessName && 
      businessType && 
      targetAudience && 
      highlightPoint && 
      selectedCategory &&
      selectedFormat
    ) {
      setIsGeneratingCopy(true);
      try {
        const generatedCopy = await generateAdCopy(
          businessName,
          businessType,
          targetAudience,
          highlightPoint,
          selectedCategory
        );
        setAdCopy(generatedCopy);
      } catch (error) {
        console.error('광고 카피 생성 실패:', error);
      } finally {
        setIsGeneratingCopy(false);
      }
    }
  };

  // 단계가 변경될 때마다 광고 카피 생성 여부 확인
  useEffect(() => {
    generateCopyIfComplete();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // 사용자 메시지 전송 처리
  const handleSendMessage = () => {
    if (!input.trim() || isTyping) return;
    
    // 사용자 메시지 추가
    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      isUser: true,
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // 대화 단계별 처리
    switch (step) {
      case 1:
        // 상호명 저장
        setBusinessName(input);
        handleNextQuestion('어떤 업종이신가요?');
        break;
      case 2:
        // 업종 저장 후 이미지 카테고리 질문
        setBusinessType(input);
        handleNextQuestion('홍보하시는 사진이 무엇인가요?', CATEGORY_OPTIONS);
        break;
      case 3:
        // 이미지 카테고리 수동 입력 처리 (필요시)
        if (!selectedCategory && CATEGORY_OPTIONS.includes(input)) {
          setSelectedCategory(input as ImageCategory);
        }
        handleNextQuestion('어떤 형식으로 만들까요?', FORMAT_OPTIONS);
        break;
      case 4:
        // 이미지 형식 수동 입력 처리 (필요시)
        handleFormatSelection(input);
        handleNextQuestion('고객층은 어떻게 되나요?');
        break;
      case 5:
        // 고객층 저장
        setTargetAudience(input);
        handleNextQuestion('광고에서 강조하고 싶은 내용은 무엇인가요?');
        break;
      case 6:
        // 강조점 저장 후 마무리
        setHighlightPoint(input);
        handleNextQuestion('이제 광고를 생성할게요. 잠시만 기다려주세요...');
        break;
      default:
        break;
    }
    
    // 입력 초기화
    setInput('');
  };

  // 이미지 형식 선택 처리
  const handleFormatSelection = (formatText: string) => {
    if (formatText.includes('블로그') || formatText.includes('인스타')) {
      setSelectedFormat('blog');
    } else if (formatText.includes('릴스')) {
      setSelectedFormat('reels');
    } else {
      setSelectedFormat('ad');
    }
  };

  // 다음 질문 처리
  const handleNextQuestion = (question: string, options?: string[]) => {
    if (!question) return;
    
    setIsTyping(true);
    
    setTimeout(() => {
      const assistantMessage: Message = {
        id: messages.length + 2,
        text: question,
        isUser: false,
        options: options
      };
      setMessages(prev => [...prev, assistantMessage]);
      setStep(prev => prev + 1);
      setIsTyping(false);
    }, 1000);
  };

  // 다중 선택 옵션 처리
  const handleOptionSelect = (option: string) => {
    if (step === 3) {
      // 이미지 카테고리 선택 처리
      setSelectedCategory(option as ImageCategory);
      
      // 사용자 메시지로 선택 내용 추가
      const userMessage: Message = {
        id: messages.length + 1,
        text: option,
        isUser: true,
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // 다음 질문으로 진행
      handleNextQuestion('어떤 형식으로 만들까요?', FORMAT_OPTIONS);
    } else if (step === 4) {
      // 이미지 형식 선택 처리
      handleFormatSelection(option);
      
      // 사용자 메시지로 선택 내용 추가
      const userMessage: Message = {
        id: messages.length + 1,
        text: option,
        isUser: true,
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // 다음 질문으로 진행
      handleNextQuestion('고객층은 어떻게 되나요?');
    }
  };

  // 메시지 발신 핸들러 (Enter 키)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 텍스트 위치 및 스타일 결정
  const getTextPositionClass = () => {
    if (selectedFormat === 'blog') {
      return 'absolute bottom-8 left-8 text-white';
    } else if (selectedFormat === 'reels') {
      return 'absolute bottom-8 left-8 text-white';
    } else if (selectedFormat === 'ad') {
      return 'absolute inset-0 flex flex-col items-center justify-center text-white text-center';
    }
    return 'absolute bottom-8 left-8 text-white';
  };

  // 밝기 조절
  const handleBrightnessChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImageBrightness(parseInt(e.target.value, 10));
  };

  // 세로 위치 조절
  const handleVerticalChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTextPositionAdjustment(parseInt(e.target.value, 10));
  };

  // 이미지 다운로드
  const handleDownload = () => {
    if (enhancedImage) {
      // 미리보기 DOM 요소 전체를 참조
      const containerElement = document.querySelector('.image-preview-container');
      
      if (!containerElement) {
        console.error('미리보기 요소를 찾을 수 없습니다.');
        return;
      }
      
      // html2canvas 라이브러리를 동적으로 로드
      import('html2canvas').then(({ default: html2canvas }) => {
        // 로딩 상태 표시
        setIsProcessing(true);
        
        // 옵션 설정 (고품질)
        const options = {
          scale: 3, // 고해상도
          useCORS: true, // 크로스 도메인 이미지 허용
          allowTaint: true,
          backgroundColor: null,
          logging: false,
          onclone: (clonedDoc: Document) => {
            // 복제된 문서에서만 텍스트 간격 조정
            const textContainer = clonedDoc.querySelector('[data-text-container]');
            const titleElement = clonedDoc.querySelector('[data-title]');
            const descElement = clonedDoc.querySelector('[data-desc]');
            
            if (selectedFormat === 'blog' && titleElement && descElement) {
              // 인스타/블로그 형식일 때만 간격 조정
              (titleElement as HTMLElement).style.marginBottom = '2rem';
              (descElement as HTMLElement).style.marginTop = '0.75rem';
              (descElement as HTMLElement).style.lineHeight = '1.6';
            }
          }
        };
        
        html2canvas(containerElement as HTMLElement, options).then((canvas: HTMLCanvasElement) => {
          // 캔버스를 이미지로 변환
          const imageUrl = canvas.toDataURL('image/jpeg', 1.0);
          
          // 이미지 다운로드
          downloadImage(imageUrl, `mendle-ad-${new Date().getTime()}.jpg`);
          
          // 로딩 상태 종료
          setIsProcessing(false);
        }).catch((error: Error) => {
          console.error('이미지 캡처 중 오류:', error);
          setIsProcessing(false);
        });
      }).catch((error: Error) => {
        console.error('html2canvas 로드 중 오류:', error);
      });
    }
  };

  // 텍스트를 균형 있게 두 줄로 나누는 함수
  const balanceText = (text: string): ReactNode => {
    if (!text) return null;

    // 광고소재 형식일 때는 중앙 정렬
    if (selectedFormat === 'ad') {
      return (
        <div className="space-y-2">
          {text.split('\n').map((line, i) => (
            <div key={i} className="text-xl font-bold">
              {line}
            </div>
          ))}
        </div>
      );
    }

    // 다른 형식일 때는 기존 로직 유지
    const lines = text.split('\n');
    if (lines.length === 1) return text;

    return (
      <div className="space-y-2">
        {lines.map((line, i) => (
          <div key={i} className={i === 0 ? 'text-xl font-bold mb-2' : 'text-lg'}>
            {line}
          </div>
        ))}
      </div>
    );
  };

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

  // 광고 카피 저장
  const saveAdCopy = async () => {
    if (!user || !adCopy.mainCopy) return;

    try {
      const { data, error } = await supabase
        .from('ad_copies')
        .insert({
          userId: user.id,
          mainCopy: adCopy.mainCopy,
          subCopy: adCopy.subCopy,
          editCount: 0,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setSavedAdCopy(data);
        showMessage('광고가 저장되었습니다.', 'success');
      }
    } catch (error) {
      console.error('광고 저장 중 오류:', error);
      showMessage('광고 저장에 실패했습니다.', 'error');
    }
  };

  // 광고 카피 업데이트 핸들러
  const handleAdCopyUpdate = (updatedCopy: AdCopyType) => {
    setSavedAdCopy(updatedCopy);
    setAdCopy({
      mainCopy: updatedCopy.mainCopy,
      subCopy: updatedCopy.subCopy,
    });
    setShowEditForm(false);
    showMessage('광고가 수정되었습니다.', 'success');
  };

  // 로그인 성공 핸들러
  const handleAuthSuccess = () => {
    setShowAuthForm(false);
    if (adCopy.mainCopy) {
      saveAdCopy();
    }
  };

  // 광고 멘트 수정 버튼 클릭 핸들러
  const handleEditClick = () => {
    if (!user) {
      setShowAuthForm(true);
      return;
    }
    
    if (!savedAdCopy && adCopy.mainCopy) {
      saveAdCopy().then(() => setShowEditForm(true));
    } else {
      setShowEditForm(true);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* 왼쪽: 채팅 인터페이스 */}
      <div className="flex-1 flex flex-col h-screen md:border-r border-gray-200">
        {/* 헤더 */}
        <div className="py-4 px-6 bg-white/80 backdrop-blur-sm border-b border-gray-100 shadow-sm z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gradient">광고 만들기</h1>
            <button 
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`mb-6 ${message.isUser ? 'flex justify-end' : 'flex justify-start'}`}
            >
              <div 
                className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                  message.isUser 
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white' 
                    : 'bg-white text-gray-800 border border-gray-100'
                }`}
              >
                <p className="text-sm md:text-base">{message.text}</p>
                
                {/* 다중 선택 옵션 버튼들 */}
                {!message.isUser && message.options && message.options.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {message.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(option)}
                        className="text-left px-3 py-2 text-sm rounded-lg bg-gray-50 hover:bg-indigo-50 transition-colors border border-gray-200 text-gray-700"
                      >
                        {idx + 1}. {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start mb-6">
              <div className="bg-white text-gray-500 px-5 py-3 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
        
        {/* 입력 영역 */}
        <div className="px-4 py-4 md:px-6 bg-white/80 backdrop-blur-sm border-t border-gray-100 shadow-sm">
          <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-200 overflow-hidden">
            <input 
              ref={inputRef}
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 focus:outline-none text-gray-700"
              disabled={isTyping || isGeneratingCopy}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping || isGeneratingCopy}
              className={`px-5 py-3 text-white ${
                !input.trim() || isTyping || isGeneratingCopy
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:opacity-90'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* 오른쪽: 이미지 미리보기 영역 */}
      <div className="w-full md:w-2/5 lg:w-1/2 bg-gray-50/50 backdrop-blur-sm flex flex-col">
        <div className="p-6 flex-1 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-gradient mb-8">이미지 미리보기</h2>
          {imagePreview && (
            <div className="relative w-full max-w-lg glass-effect p-4 rounded-2xl overflow-hidden">
              <div className="relative rounded-xl overflow-hidden shadow-lg image-preview-container">
                <NextImage 
                  src={enhancedImage || imagePreview} 
                  alt="업로드된 이미지" 
                  width={1080}
                  height={selectedFormat === 'blog' ? 1350 : 1920}
                  className="w-full h-auto" 
                  unoptimized 
                  style={{
                    filter: `brightness(${1 + imageBrightness * 0.01})`
                  }}
                />
                {(isProcessing || isGeneratingCopy) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                    <div className="text-white font-medium">
                      {isProcessing ? '이미지 보정 중...' : '광고 문구 생성 중...'}
                    </div>
                  </div>
                )}
                {businessName && enhancedImage && !isProcessing && !isGeneratingCopy && (
                  <div 
                    className={getTextPositionClass()}
                    data-text-container
                    style={{ 
                      transform: selectedFormat === 'ad' 
                        ? `translateY(${textPositionAdjustment}px)` 
                        : `translateY(${-textPositionAdjustment}px)` 
                    }}
                  >
                    <h3 
                      data-title
                      className={`text-white font-bold text-shadow ${
                        selectedFormat === 'blog' 
                          ? 'text-3xl md:text-4xl lg:text-5xl' 
                          : 'text-2xl md:text-3xl'
                      }`}
                      style={{ 
                        fontFamily: selectedFormat !== 'ad' ? 'Pretendard, sans-serif' : 'inherit',
                        letterSpacing: selectedFormat === 'blog' ? '-0.02em' : 'inherit',
                        marginBottom: selectedFormat === 'blog' ? '0.75rem' : '0.5rem',
                        textAlign: 'left',
                        // 두 줄로 나뉠 때 아래 줄에 더 많은 텍스트가 오도록 조정 
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                      {balanceText(adCopy.mainCopy || businessName)}
                    </h3>
                    {step > 3 && adCopy.subCopy && (
                      <p 
                        data-desc
                        className={`text-white opacity-90 text-shadow ${
                          selectedFormat === 'blog' 
                            ? 'text-base md:text-lg' 
                            : 'text-sm md:text-base'
                        }`}
                        style={{
                          lineHeight: selectedFormat === 'blog' ? '1.5' : '1.4'
                        }}>
                        {adCopy.subCopy}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {step >= 7 && !isGeneratingCopy && enhancedImage && (
            <div className="mt-6 flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">밝기</span>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={imageBrightness}
                  onChange={handleBrightnessChange}
                  className="w-32"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">위치 조정</span>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={textPositionAdjustment}
                  onChange={handleVerticalChange}
                  className="w-32"
                />
              </div>
              
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-md bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:opacity-90 transition-all"
              >
                다운로드
              </button>
            </div>
          )}
          
          <div className="mt-8 text-center text-sm text-gray-500 max-w-md">
            {step >= 7 && !isGeneratingCopy && adCopy.mainCopy 
              ? '광고 카피가 Gemini AI에 의해 생성되었습니다'
              : '질문에 답변하면서 AI가 최적의 광고 이미지를 생성합니다'}
          </div>
        </div>
      </div>

      {/* 인증 모달 */}
      {showAuthForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <AuthForm onSuccess={handleAuthSuccess} />
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditForm && savedAdCopy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <EditAdCopy
            adCopy={savedAdCopy}
            onUpdate={handleAdCopyUpdate}
            onCancel={() => setShowEditForm(false)}
          />
        </div>
      )}
    </div>
  );
} 