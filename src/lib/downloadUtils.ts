/**
 * 이미지 다운로드 함수
 * DataURL 형식으로 된 이미지를 사용자 지정 파일명으로 다운로드
 * 
 * @param dataUrl - 다운로드할 이미지의 dataURL
 * @param filename - 저장할 파일명
 */
export const downloadImage = (dataUrl: string, filename: string): void => {
  // a 요소 생성
  const link = document.createElement('a');
  
  // 다운로드 속성 및 파일명 설정
  link.download = filename;
  
  // href 속성에 dataURL 지정
  link.href = dataUrl;
  
  // DOM에 임시로 추가
  document.body.appendChild(link);
  
  // 클릭 이벤트 트리거
  link.click();
  
  // DOM에서 제거
  document.body.removeChild(link);
}; 