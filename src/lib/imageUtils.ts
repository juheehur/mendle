/**
 * 이미지를 보정하는 비동기 함수
 * - 이미지 리사이징 (형식에 따라 다른 크기)
 * - 밝기 및 대비 조정
 * - 형식에 따른 오버레이 적용
 */

export const imageFilters: Record<string, string> = {
  "음식": "brightness(1.1) contrast(1.2) saturate(1.3)", 
  // 음식은 식욕 자극이 중요 → 채도·대비 높게, 따뜻한 느낌

  "인테리어/공간": "brightness(1.15) contrast(1.05) saturate(1.05)", 
  // 공간은 밝고 깨끗해야 함 → 밝기 우선, 채도는 과하지 않게

  "제품 (잡화/화장품 등)": "brightness(1.05) contrast(1.2) saturate(1.25)",
  // 제품은 선명하고 눈에 띄어야 → 대비·채도 강조

  "의류 / 패션": "brightness(1.1) saturate(1.15) contrast(1.1)",
  // 옷 색상 정확하게, 피부톤도 정리되게 → 살짝 밝고 선명하게

  "헤어 / 뷰티": "brightness(1.08) contrast(1.15) saturate(1.1) blur(0.5px)",
  // 부드럽고 피부 표현 강조 → 약간 소프트 효과 (blur)

  "행사": "contrast(1.3) saturate(1.2) brightness(1.05)",
  // 현장은 생동감 강조 → 강한 대비와 색감
};

export const enhanceImage = async (
  imageUrl: string, 
  category?: string, 
  format?: string | null
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // 캔버스 생성 (크기는 형식에 따라 설정)
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        resolve(imageUrl); // 캔버스 지원되지 않으면 원본 반환
        return;
      }
      
      // 이미지 크기 설정 (형식에 따라 다른 크기 적용)
      canvas.width = 1080;
      canvas.height = format === 'blog' ? 1350 : 1920;
      
      // 이미지 비율 계산
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;
      
      // 이미지 그리기 (비율 유지하면서 캔버스에 맞춤)
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgRatio > canvasRatio) {
        // 이미지가 더 넓은 경우: 높이 맞추고 너비는 중앙에서 크롭
        drawHeight = canvas.height;
        drawWidth = img.width * (canvas.height / img.height);
        drawX = (canvas.width - drawWidth) / 2;
        drawY = 0;
      } else {
        // 이미지가 더 좁은 경우: 너비 맞추고 높이는 중앙에서 크롭
        drawWidth = canvas.width;
        drawHeight = img.height * (canvas.width / img.width);
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2;
      }
      
      // 캔버스 배경 검정으로 채우기 (투명 부분 방지)
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 이미지 그리기
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      
      // 카테고리별 필터 적용 (선택된 경우)
      if (category && imageFilters[category]) {
        // 필터 설정을 CSS에서 직접 적용할 수 없으므로, 
        // 각 필터를 수동으로 적용해야 함

        // 이미지 데이터 가져오기
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // CSS 필터 문자열에서 각 값 추출
        const filterStr = imageFilters[category];
        const brightnessMatch = filterStr.match(/brightness\(([0-9.]+)\)/);
        const contrastMatch = filterStr.match(/contrast\(([0-9.]+)\)/);
        const saturateMatch = filterStr.match(/saturate\(([0-9.]+)\)/);
        
        // 밝기 값 (기본값: 1.0)
        const brightness = brightnessMatch ? parseFloat(brightnessMatch[1]) : 1.0;
        // 대비 값 (기본값: 1.0)
        const contrast = contrastMatch ? parseFloat(contrastMatch[1]) : 1.0;
        // 채도 값 (기본값: 1.0)
        const saturate = saturateMatch ? parseFloat(saturateMatch[1]) : 1.0;
        
        // 픽셀 데이터 처리
        for (let i = 0; i < data.length; i += 4) {
          // 밝기 조정
          data[i] = Math.min(255, data[i] * brightness);
          data[i + 1] = Math.min(255, data[i + 1] * brightness);
          data[i + 2] = Math.min(255, data[i + 2] * brightness);
          
          // 대비 조정
          data[i] = Math.min(255, ((data[i] - 128) * contrast) + 128);
          data[i + 1] = Math.min(255, ((data[i + 1] - 128) * contrast) + 128);
          data[i + 2] = Math.min(255, ((data[i + 2] - 128) * contrast) + 128);
          
          // 채도 조정 (RGB -> HSL -> 채도 조정 -> RGB)
          let r = data[i] / 255;
          let g = data[i + 1] / 255;
          let b = data[i + 2] / 255;
          
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const l = (max + min) / 2;
          
          let h, s;
          
          if (max === min) {
            h = s = 0; // achromatic
          } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
              case r: h = (g - b) / d + (g < b ? 6 : 0); break;
              case g: h = (b - r) / d + 2; break;
              case b: h = (r - g) / d + 4; break;
              default: h = 0;
            }
            
            h /= 6;
          }
          
          // 채도 조정 (saturate)
          s = Math.min(1, s * saturate);
          
          // HSL -> RGB 변환
          if (s === 0) {
            r = g = b = l; // achromatic
          } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            const hueToRgb = (p: number, q: number, t: number) => {
              if (t < 0) t += 1;
              if (t > 1) t -= 1;
              if (t < 1/6) return p + (q - p) * 6 * t;
              if (t < 1/2) return q;
              if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
            };
            
            r = hueToRgb(p, q, h + 1/3);
            g = hueToRgb(p, q, h);
            b = hueToRgb(p, q, h - 1/3);
          }
          
          // RGB 값 업데이트
          data[i] = Math.min(255, Math.max(0, Math.round(r * 255)));
          data[i + 1] = Math.min(255, Math.max(0, Math.round(g * 255)));
          data[i + 2] = Math.min(255, Math.max(0, Math.round(b * 255)));
        }
        
        // 이미지 데이터 적용
        ctx.putImageData(imageData, 0, 0);
      } else {
        // 기본 보정 (기존 코드)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const brightness = 10; // 밝기 조정값 (0-255)
        const contrast = 20; // 대비 조정값 (0-255)
        
        for (let i = 0; i < imageData.data.length; i += 4) {
          // 밝기 조정
          imageData.data[i] = Math.min(255, imageData.data[i] + brightness);
          imageData.data[i + 1] = Math.min(255, imageData.data[i + 1] + brightness);
          imageData.data[i + 2] = Math.min(255, imageData.data[i + 2] + brightness);
          
          // 대비 조정
          imageData.data[i] = Math.min(255, ((imageData.data[i] - 128) * (contrast / 128)) + 128);
          imageData.data[i + 1] = Math.min(255, ((imageData.data[i + 1] - 128) * (contrast / 128)) + 128);
          imageData.data[i + 2] = Math.min(255, ((imageData.data[i + 2] - 128) * (contrast / 128)) + 128);
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
      
      // 형식에 따른 오버레이 적용
      if (format === 'ad') {
        // 광고소재: 위에서 아래로 그라데이션
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.5);
        gradient.addColorStop(0, "rgba(0, 0, 0, 0.7)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // 블로그/인스타 또는 릴스: 전체 화면에 검은색 60% 투명도 오버레이
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // 결과 반환
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    
    img.onerror = () => {
      resolve(imageUrl); // 오류 발생 시 원본 반환
    };
    
    img.src = imageUrl;
  });
}; 