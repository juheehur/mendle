import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

type AuthFormProps = {
  onSuccess: () => void;
};

const CONTENT_CATEGORIES = [
  '뷰티/패션',
  '여행',
  '음식/요리',
  '라이프스타일',
  '게임',
  '교육',
  '테크/IT',
  '엔터테인먼트',
  '스포츠/피트니스',
  '기타'
];

type Question = {
  id: string;
  text: string;
  type: 'email' | 'password' | 'text' | 'select' | 'number' | 'social';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  validation?: (value: string) => boolean;
  errorMessage?: string;
};

const QUESTIONS: Question[] = [
  {
    id: 'email',
    text: '안녕하세요! 시작하기 전에 이메일 주소를 알려주세요 ✉️',
    type: 'email',
    required: true,
    validation: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    errorMessage: '올바른 이메일 주소를 입력해주세요'
  },
  {
    id: 'password',
    text: '비밀번호를 설정해주세요 🔒',
    type: 'password',
    required: true,
    validation: (value) => value.length >= 6,
    errorMessage: '비밀번호는 최소 6자 이상이어야 합니다'
  },
  {
    id: 'nickname',
    text: '멋진 닉네임을 지어주세요 ✨',
    type: 'text',
    required: true,
    placeholder: '예: 여행하는고양이'
  },
  {
    id: 'category',
    text: '주로 어떤 콘텐츠를 만드시나요? 🎯',
    type: 'select',
    options: CONTENT_CATEGORIES,
    required: true
  },
  {
    id: 'social',
    text: '운영중인 SNS를 알려주세요 📱\n하나만 입력해도 괜찮아요!',
    type: 'social',
    placeholder: '@계정명 또는 URL'
  },
  {
    id: 'followers',
    text: '전체 팔로워 수는 어느정도인가요? 🌟',
    type: 'number',
    placeholder: '숫자만 입력'
  }
];

type SocialData = {
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  blog?: string;
  threads?: string;
};

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialInputs, setSocialInputs] = useState({
    instagram: '',
    youtube: '',
    tiktok: '',
    blog: '',
    threads: ''
  });

  const handleNext = async (value: string) => {
    const currentQuestion = QUESTIONS[currentQuestionIndex];
    
    if (currentQuestion.validation && !currentQuestion.validation(value)) {
      setError(currentQuestion.errorMessage || '입력값이 올바르지 않습니다.');
      return;
    }

    setError(null);
    
    if (currentQuestion.type === 'social') {
      // 소셜 미디어 입력은 별도 처리
      setAnswers(prev => ({ ...prev, social: JSON.stringify(socialInputs) }));
    } else {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    }

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      await handleSignUp();
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      // 1. 회원가입 시도
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: answers.email,
        password: answers.password,
        options: {
          data: {
            nickname: answers.nickname,
          }
        }
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        if (signUpError.message === 'User already registered') {
          setError('이미 가입된 이메일입니다. 로그인을 시도해주세요.');
          setTimeout(() => {
            setIsSignUp(false);
            setAnswers(prev => ({
              email: prev.email,
              password: prev.password
            }));
          }, 2000);
          return;
        }
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('User data not received after signup');
      }

      // 2. 소셜 데이터 파싱
      let socialData: SocialData = {};
      try {
        socialData = JSON.parse(answers.social || '{}') as SocialData;
      } catch (e) {
        console.warn('Failed to parse social data:', e);
      }

      // 3. 프로필 데이터 준비
      const newProfileData = {
        user_id: authData.user.id,
        nickname: answers.nickname,
        instagram_handle: socialData.instagram || null,
        youtube_channel: socialData.youtube || null,
        tiktok_handle: socialData.tiktok || null,
        blog_url: socialData.blog || null,
        threads_handle: socialData.threads || null,
        content_category: answers.category || '기타',
        followers_count: parseInt(answers.followers) || 0,
      };

      console.log('Creating profile with data:', JSON.stringify(newProfileData, null, 2));

      // 4. 자동 로그인 처리
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: answers.email,
        password: answers.password,
      });

      if (signInError) {
        console.error('Auto sign-in error:', signInError);
        throw signInError;
      }

      // 5. 프로필 생성 시도
      const { data: createdProfile, error: profileError } = await supabase
        .from('creator_profiles')
        .insert(newProfileData)
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error details:', {
          error: profileError,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });

        // Supabase 연결 확인
        const { data: healthCheck, error: healthError } = await supabase
          .from('creator_profiles')
          .select('count')
          .limit(1);

        if (healthError) {
          console.error('Supabase connection error:', healthError);
          throw new Error('데이터베이스 연결에 문제가 있습니다.');
        }

        throw new Error(`프로필 생성 중 오류가 발생했습니다: ${profileError.message || '알 수 없는 오류'}`);
      }

      // 6. 성공 처리
      console.log('Profile created successfully:', createdProfile);
      onSuccess();
      
    } catch (error) {
      console.error('Full error details:', {
        error,
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        type: typeof error
      });
      
      if (error instanceof Error) {
        setError(`오류가 발생했습니다: ${error.message}`);
      } else if (typeof error === 'object' && error !== null) {
        const errorStr = JSON.stringify(error, null, 2);
        console.error('Stringified error:', errorStr);
        setError(`오류가 발생했습니다: ${errorStr}`);
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: answers.email,
        password: answers.password,
      });
      if (error) throw error;
      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = QUESTIONS[currentQuestionIndex];

  const handleNextWithValidation = () => {
    const value = answers[currentQuestion.id] || '';
    handleNext(value);
  };

  const renderInput = () => {
    switch (currentQuestion.type) {
      case 'social':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">@</span>
              <input
                type="text"
                placeholder="인스타그램"
                value={socialInputs.instagram}
                onChange={(e) => setSocialInputs(prev => ({ ...prev, instagram: e.target.value }))}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <input
              type="url"
              placeholder="유튜브 채널 URL"
              value={socialInputs.youtube}
              onChange={(e) => setSocialInputs(prev => ({ ...prev, youtube: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="flex items-center gap-2">
              <span className="text-gray-500">@</span>
              <input
                type="text"
                placeholder="틱톡"
                value={socialInputs.tiktok}
                onChange={(e) => setSocialInputs(prev => ({ ...prev, tiktok: e.target.value }))}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">@</span>
              <input
                type="text"
                placeholder="스레드"
                value={socialInputs.threads}
                onChange={(e) => setSocialInputs(prev => ({ ...prev, threads: e.target.value }))}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <input
              type="url"
              placeholder="블로그 URL"
              value={socialInputs.blog}
              onChange={(e) => setSocialInputs(prev => ({ ...prev, blog: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={() => handleNext('')}
              className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium hover:opacity-90"
            >
              다음
            </button>
          </div>
        );
      case 'select':
        return (
          <select
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleNext(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">선택해주세요</option>
            {currentQuestion.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'number':
        return (
          <div>
            <input
              type="number"
              placeholder={currentQuestion.placeholder}
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => {
                const newValue = e.target.value;
                setAnswers(prev => ({ ...prev, [currentQuestion.id]: newValue }));
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required={currentQuestion.required}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleNextWithValidation();
                }
              }}
            />
            <button
              onClick={handleNextWithValidation}
              className="w-full mt-4 py-2 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium hover:opacity-90"
            >
              다음
            </button>
          </div>
        );
      default:
        return (
          <div>
            <input
              type={currentQuestion.type}
              placeholder={currentQuestion.placeholder}
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => {
                const newValue = e.target.value;
                setAnswers(prev => ({ ...prev, [currentQuestion.id]: newValue }));
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required={currentQuestion.required}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleNextWithValidation();
                }
              }}
            />
          </div>
        );
    }
  };

  const renderNextButton = () => {
    if (currentQuestion.type === 'social' || currentQuestion.type === 'number') return null;
    
    return (
      <button
        onClick={handleNextWithValidation}
        disabled={!answers[currentQuestion.id] && currentQuestion.required}
        className="w-full mt-4 py-2 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium hover:opacity-90 disabled:opacity-50"
      >
        다음
      </button>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gradient">
        {isSignUp ? '회원가입' : '로그인'}
      </h2>
      
      {isSignUp ? (
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <p className="text-lg text-gray-700 whitespace-pre-line">
                {currentQuestion.text}
              </p>
              {renderInput()}
              {renderNextButton()}
            </motion.div>
          </AnimatePresence>
          
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm"
            >
              {error}
            </motion.div>
          )}
          
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className="w-full text-sm text-indigo-600 hover:text-indigo-500"
            >
              이미 계정이 있으신가요? 로그인
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="이메일"
            value={answers.email || ''}
            onChange={(e) => setAnswers(prev => ({ ...prev, email: e.target.value }))}
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={answers.password || ''}
            onChange={(e) => setAnswers(prev => ({ ...prev, password: e.target.value }))}
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '처리중...' : '로그인'}
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className="w-full text-sm text-indigo-600 hover:text-indigo-500"
          >
            계정이 없으신가요? 회원가입
          </button>
        </form>
      )}
    </div>
  );
} 