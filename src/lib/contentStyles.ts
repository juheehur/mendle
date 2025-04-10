export type ContentType = 'reels' | 'card';

export type ContentStyle = {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  textPosition: 'top' | 'center' | 'bottom';
  textAlign: 'left' | 'center' | 'right';
  textColor: string;
  overlayColor: string;
  overlayOpacity: number;
  fontStyle: string;
  border?: boolean;
  overlayImage?: string;
  accountPosition?: 'top' | 'bottom';
};

export const contentStyles: ContentStyle[] = [
  {
    id: 'style1',
    name: '🖼️ 심플 박스 스타일',
    description: '얇은 테두리와 깔끔하고 귀여운 폰트',
    previewImage: '/styles/1.png',
    textPosition: 'bottom',
    textAlign: 'left',
    textColor: '#ffffff',
    overlayColor: '#000000',
    overlayOpacity: 0.5,
    fontStyle: 'Dovemayo_gothic',
    border: true,
    accountPosition: 'top'
  },
  {
    id: 'style2',
    name: '🖋️ 모던 미니멀 스타일',
    description: '글자에 집중되는 레이아웃, 심플하면서도 감성적',
    previewImage: '/styles/2.png',
    textPosition: 'bottom',
    textAlign: 'left',
    textColor: '#ffffff',
    overlayColor: '#000000',
    overlayOpacity: 0.5,
    fontStyle: 'Pretendard',
    accountPosition: 'bottom'
  },
  {
    id: 'style3',
    name: '✨ 반짝이 효과 스타일',
    description: '배경에 별빛 효과를 더해, 귀여움을 극대화',
    previewImage: '/styles/3.png',
    textPosition: 'center',
    textAlign: 'center',
    textColor: '#ffffff',
    overlayColor: '#000000',
    overlayOpacity: 0.6,
    fontStyle: 'Pretendard',
    overlayImage: '/styles/star.png',
    accountPosition: 'top'
  },
  {
    id: 'style4',
    name: '🌊 곡선 프레임 스타일',
    description: '자연스러운 곡선 테두리로 부드럽고 감성적인 분위기',
    previewImage: '/styles/4.png',
    textPosition: 'center',
    textAlign: 'center',
    textColor: '#ffffff',
    overlayColor: '#000000',
    overlayOpacity: 0.5,
    fontStyle: 'Dovemayo_gothic',
    overlayImage: '/styles/wave.png',
    accountPosition: 'top'
  }
];

export const getStyleById = (id: string): ContentStyle | undefined => {
  return contentStyles.find(style => style.id === id);
}; 