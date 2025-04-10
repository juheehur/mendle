/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
    unoptimized: true, // 로컬 이미지 URL 처리를 위한 설정
  },
};

module.exports = nextConfig; 