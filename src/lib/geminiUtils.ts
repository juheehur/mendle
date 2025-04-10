import { GoogleGenerativeAI } from '@google/generative-ai';

// API 키는 환경 변수에서 가져오거나, 임시 테스트용 키 사용
// 실제 프로덕션에서는 반드시 환경 변수 사용
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'YOUR_API_KEY';

// Gemini AI 초기화
const genAI = new GoogleGenerativeAI(API_KEY);

// 후킹한 제목 작성법 예시들
const HOOKING_EXAMPLES = [
  "\"성공한 사람들의 7가지 아침 루틴\" - 숫자 활용",
  "\"당신이 자꾸 피곤한 진짜 이유는?\" - 질문형으로 호기심 자극",
  "\"이걸 모르면 당신의 계좌가 위험합니다\" - 긴박감 주기",
  "\"아무도 말해주지 않았던 투자 성공의 비밀\" - '비밀' 키워드 활용",
  "\"월급이 적은 게 오히려 좋은 이유\" - 독특한 시선/반전",
  "\"일 잘하는 사람 vs 일 시키기 싫은 사람\" - 대비/비교",
  "\"하루 10분으로 체중 5kg 빼는 법\" - 구체적인 결과 약속",
  "\"나만 이런 줄 알았는데… 다 그렇더라\" - 공감 자극",
  "\"직장인의 83%, 이 실수로 커리어가 망합니다\" - 충격적 통계",
  "\"글쓰기 1도 몰라도 3일 만에 블로그 시작하는 법\" - '누구나 가능' 강조"
];

/**
 * Gemini를 사용하여 광고 카피 생성
 * @param businessName 비즈니스 이름
 * @param businessType 업종
 * @param targetAudience 고객층
 * @param highlightPoint 강조하고 싶은 내용
 * @param category 이미지 카테고리
 * @returns 생성된 광고 카피
 */
export const generateAdCopy = async (
  businessName: string,
  businessType: string,
  targetAudience: string,
  highlightPoint: string,
  category: string
): Promise<{ mainCopy: string; subCopy: string }> => {
  try {
    // 프롬프트 준비
    const prompt = `
비즈니스 이름: ${businessName}
업종: ${businessType}
고객층: ${targetAudience}
강조점: ${highlightPoint}
이미지 카테고리: ${category}

당신은 주목을 끄는 강력한 광고 카피를 작성하는 전문가입니다.
위 정보를 바탕으로 매우 강력하고 후킹하는 광고 문구 2개를 생성해주세요.

후킹하는 문구 작성법:
1. 숫자를 활용하기 (예: "5분 만에...")
2. 질문형으로 호기심 자극하기 (예: "왜 모두가...?")
3. 긴박감이나 위기감 주기 (예: "지금 놓치면...")
4. '비밀'이나 '숨겨진' 키워드 활용하기
5. 독특한 관점이나 반전 제시하기
6. 대비나 비교 활용하기 (예: "A보다 B가 좋은 이유")
7. 구체적인 결과 약속하기
8. 공감대 형성하기
9. 충격적인 사실이나 통계 활용하기
10. '누구나' 또는 '초보도 가능' 강조하기

참고 예시:
${HOOKING_EXAMPLES.join('\n')}

- 메인 카피: 짧고 임팩트 있는 한 문장 (20자 이내)
- 서브 카피: 부연 설명 (30자 이내)

반드시 후킹 기법을 적용하여 호기심과 클릭을 유발하는 문구로 작성해주세요.
너무 과장되거나 거짓된 내용은 피하되, 사람들의 시선을 사로잡는 강력한 메시지를 만들어주세요.
(((당신은 한국인입니다. 자연스럽게 적어주세요.)))

형식:
메인: [메인 카피]
서브: [서브 카피]
`;

    // Gemini 모델 사용
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 응답에서 메인 카피와 서브 카피 추출
    const mainMatch = text.match(/메인: (.*)/);
    const subMatch = text.match(/서브: (.*)/);

    const mainCopy = mainMatch ? mainMatch[1].trim() : '최고의 선택';
    const subCopy = subMatch ? subMatch[1].trim() : '당신을 위한 최상의 서비스';

    // 결과가 너무 길면 적절한 길이로 자르기
    return {
      mainCopy: mainCopy.length > 20 ? mainCopy.substring(0, 20) + '...' : mainCopy,
      subCopy: subCopy.length > 30 ? subCopy.substring(0, 30) + '...' : subCopy,
    };
  } catch (error) {
    console.error('광고 카피 생성 중 오류 발생:', error);
    // 오류 발생 시 기본 카피 반환
    return {
      mainCopy: '최고의 선택',
      subCopy: '당신을 위한 최상의 서비스',
    };
  }
}; 