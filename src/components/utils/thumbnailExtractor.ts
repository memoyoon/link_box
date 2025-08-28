// YouTube URL에서 비디오 ID 추출
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
      return urlObj.searchParams.get('v');
    }
    
    // youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    
    // m.youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname === 'm.youtube.com' && urlObj.pathname === '/watch') {
      return urlObj.searchParams.get('v');
    }
    
    return null;
  } catch {
    return null;
  }
}

// YouTube 썸네일 URL 생성
export function getYouTubeThumbnail(videoId: string, quality: 'max' | 'hq' | 'mq' = 'hq'): string {
  const qualityMap = {
    max: 'maxresdefault',
    hq: 'hqdefault',
    mq: 'mqdefault'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

// HTML에서 메타태그 추출
function extractMetaFromHTML(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const getMetaContent = (selector: string): string | null => {
    const element = doc.querySelector(selector);
    return element?.getAttribute('content') || null;
  };
  
  const title = 
    getMetaContent('meta[property="og:title"]') ||
    getMetaContent('meta[name="twitter:title"]') ||
    doc.querySelector('title')?.textContent ||
    null;
    
  const description = 
    getMetaContent('meta[property="og:description"]') ||
    getMetaContent('meta[name="twitter:description"]') ||
    getMetaContent('meta[name="description"]') ||
    null;
    
  const image = 
    getMetaContent('meta[property="og:image"]') ||
    getMetaContent('meta[name="twitter:image"]') ||
    getMetaContent('meta[name="twitter:image:src"]') ||
    null;
    
  return {
    title: title?.trim(),
    description: description?.trim(),
    image: image?.trim()
  };
}

// CORS 프록시를 통해 웹페이지 내용 가져오기
async function fetchPageContent(url: string): Promise<string> {
  // 여러 CORS 프록시 서비스 시도 (무료 서비스들)
  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://cors-anywhere.herokuapp.com/${url}`
  ];
  
  for (const proxyUrl of proxies) {
    try {
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      return data.contents || data.body || '';
    } catch (error) {
      console.log(`CORS 프록시 ${proxyUrl} 실패:`, error);
      continue;
    }
  }
  
  throw new Error('모든 CORS 프록시에서 페이지를 가져올 수 없습니다');
}

// 도메인별 기본 썸네일 가져오기
function getDefaultThumbnailByDomain(url: string): string | null {
  try {
    const domain = new URL(url).hostname.toLowerCase().replace('www.', '');
    
    const domainThumbnails: Record<string, string> = {
      'github.com': 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=200&fit=crop',
      'medium.com': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=200&fit=crop',
      'dev.to': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop',
      'stackoverflow.com': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop',
      'reddit.com': 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=400&h=200&fit=crop',
      'twitter.com': 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&h=200&fit=crop',
      'x.com': 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&h=200&fit=crop',
      'linkedin.com': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=200&fit=crop',
      'instagram.com': 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=400&h=200&fit=crop',
      'tiktok.com': 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&h=200&fit=crop'
    };
    
    // 정확한 도메인 매치
    if (domainThumbnails[domain]) {
      return domainThumbnails[domain];
    }
    
    // 부분 매치
    for (const [key, thumbnail] of Object.entries(domainThumbnails)) {
      if (domain.includes(key)) {
        return thumbnail;
      }
    }
    
    // 일반적인 카테고리별 기본 이미지
    if (domain.includes('blog') || domain.includes('medium') || domain.includes('substack')) {
      return 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=200&fit=crop';
    }
    
    if (domain.includes('news') || domain.includes('times') || domain.includes('post')) {
      return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop';
    }
    
    if (domain.includes('shop') || domain.includes('store') || domain.includes('market')) {
      return 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop';
    }
    
    return null;
  } catch {
    return null;
  }
}

// 도메인별 기본 제목 생성
function getDefaultTitleByDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // 경로가 있는 경우 경로 정보도 포함
    if (urlObj.pathname && urlObj.pathname !== '/') {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        return `${domain} - ${lastPart.replace(/[-_]/g, ' ')}`;
      }
    }
    
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Untitled Link';
  }
}

// 이전 함수와의 호환성을 위해 유지
export function extractThumbnailFromUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    return getYouTubeThumbnail(videoId, 'hq');
  }
  
  return getDefaultThumbnailByDomain(url);
}

// 메인 메타데이터 추출 함수
export async function extractMetadata(url: string): Promise<{
  title?: string;
  description?: string;
  thumbnail?: string;
  error?: string;
}> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase().replace('www.', '');
    
    // YouTube 특별 처리
    if (domain.includes('youtube.com') || domain === 'youtu.be' || domain === 'm.youtube.com') {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        return {
          title: `YouTube Video`,
          thumbnail: getYouTubeThumbnail(videoId, 'hq')
        };
      }
    }
    
    // 일반 웹페이지 메타데이터 추출 시도
    try {
      const html = await fetchPageContent(url);
      const metadata = extractMetaFromHTML(html);
      
      return {
        title: metadata.title || getDefaultTitleByDomain(url),
        description: metadata.description,
        thumbnail: metadata.image || getDefaultThumbnailByDomain(url)
      };
    } catch (corsError) {
      console.log('CORS 프록시를 통한 메타데이터 추출 실패:', corsError);
      
      // CORS 실패 시 기본값 반환
      return {
        title: getDefaultTitleByDomain(url),
        thumbnail: getDefaultThumbnailByDomain(url),
        error: 'CORS 제한으로 인해 기본 정보만 표시됩니다'
      };
    }
  } catch (error) {
    console.error('메타데이터 추출 실패:', error);
    return {
      title: 'Untitled Link',
      error: '메타데이터를 가져올 수 없습니다'
    };
  }
}

// 빠른 메타데이터 추출 (사용자 경험 향상을 위해)
export function extractQuickMetadata(url: string): {
  title: string;
  thumbnail?: string;
} {
  try {
    // YouTube 즉시 처리
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      return {
        title: 'YouTube Video',
        thumbnail: getYouTubeThumbnail(videoId, 'hq')
      };
    }
    
    // 기본 정보 즉시 반환
    return {
      title: getDefaultTitleByDomain(url),
      thumbnail: getDefaultThumbnailByDomain(url) || undefined
    };
  } catch {
    return {
      title: 'Untitled Link'
    };
  }
}