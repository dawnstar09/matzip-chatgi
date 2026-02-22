import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 보안: X-Powered-By 헤더 제거 (서버 정보 노출 방지)
  poweredByHeader: false,

  // gzip/brotli 압축 활성화
  compress: true,

  // 이미지 최적화
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30일 캐시
    dangerouslyAllowSVG: false,
  },

  // 보안 HTTP 헤더
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 클릭재킹 방지
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // MIME 타입 스니핑 방지
          { key: "X-Content-Type-Options", value: "nosniff" },
          // XSS 방어 (구형 브라우저)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // 리퍼러 정보 최소화
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 권한 정책: 위치는 자기 자신만, 카메라/마이크 차단
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(), microphone=(), payment=()",
          },
          // HTTPS 강제 (HSTS) - Vercel에서 유효
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      // 정적 파일 캐시 최적화
      {
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // API 캐시 방지
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
