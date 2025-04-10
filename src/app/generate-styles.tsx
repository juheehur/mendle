'use client';

import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

// 스타일 1: 모던 심플
const Style1 = () => (
  <div className="w-[200px] h-[200px] relative bg-gradient-to-br from-gray-800 to-gray-900 p-4 flex flex-col justify-end">
    <div className="absolute bottom-4 left-4 text-white">
      <div className="text-sm font-medium mb-1 opacity-80">@username</div>
      <div className="text-lg font-bold">모던 심플 스타일</div>
    </div>
  </div>
);

// 스타일 2: 감성 그라데이션
const Style2 = () => (
  <div className="w-[200px] h-[200px] relative bg-gradient-to-br from-indigo-500 to-purple-600 p-4 flex items-center justify-center">
    <div className="text-center text-white">
      <div className="text-sm font-medium mb-1 opacity-80">@username</div>
      <div className="text-lg font-bold">감성 그라데이션</div>
    </div>
  </div>
);

// 스타일 3: 비즈니스 프로
const Style3 = () => (
  <div className="w-[200px] h-[200px] relative bg-gradient-to-br from-gray-700 to-gray-800 p-4">
    <div className="absolute top-4 right-4 text-right text-white">
      <div className="text-sm font-medium mb-1 opacity-80">@username</div>
      <div className="text-lg font-bold">비즈니스 프로</div>
    </div>
  </div>
);

export default function GenerateStyles() {
  const style1Ref = useRef<HTMLDivElement>(null);
  const style2Ref = useRef<HTMLDivElement>(null);
  const style3Ref = useRef<HTMLDivElement>(null);

  const downloadStyle = async (ref: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!ref.current) return;
    
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = fileName;
      link.click();
      
      alert(`${fileName} 이미지가 다운로드되었습니다`);
    } catch (error) {
      console.error('다운로드 중 오류 발생:', error);
      alert('다운로드 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="p-10 flex flex-col items-center gap-8">
      <h1 className="text-2xl font-bold mb-6">스타일 이미지 생성</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center gap-2">
          <div ref={style1Ref}>
            <Style1 />
          </div>
          <button 
            onClick={() => downloadStyle(style1Ref, 'style1.png')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            스타일 1 다운로드
          </button>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div ref={style2Ref}>
            <Style2 />
          </div>
          <button 
            onClick={() => downloadStyle(style2Ref, 'style2.png')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            스타일 2 다운로드
          </button>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div ref={style3Ref}>
            <Style3 />
          </div>
          <button 
            onClick={() => downloadStyle(style3Ref, 'style3.png')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            스타일 3 다운로드
          </button>
        </div>
      </div>
    </div>
  );
} 