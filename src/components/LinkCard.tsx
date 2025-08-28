import React from 'react';
import { ExternalLink, Trash2, Clock, FileText, Youtube } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { extractThumbnailFromUrl, extractYouTubeVideoId } from './utils/thumbnailExtractor';
import type { Link } from '../App';

interface LinkCardProps {
  link: Link;
  onDelete: () => void;
}

export function LinkCard({ link, onDelete }: LinkCardProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const isYouTubeUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase().replace('www.', '');
      return domain.includes('youtube.com') || domain === 'youtu.be' || domain === 'm.youtube.com';
    } catch {
      return false;
    }
  };

  const handleCardClick = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  // 썸네일 우선순위: 사용자 설정 > 자동 추출 > null
  const thumbnailUrl = link.thumbnail || extractThumbnailFromUrl(link.url);
  const isYouTube = isYouTubeUrl(link.url);
  const hasYouTubeThumbnail = isYouTube && extractYouTubeVideoId(link.url);

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
      <CardContent className="p-0" onClick={handleCardClick}>
        {/* 썸네일 이미지 */}
        {thumbnailUrl ? (
          <div className="aspect-[2/1] overflow-hidden relative">
            <ImageWithFallback
              src={thumbnailUrl}
              alt={link.title}
              className="w-full h-full object-cover"
            />
            {/* YouTube 배지 */}
            {hasYouTubeThumbnail && (
              <div className="absolute bottom-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <Youtube className="w-3 h-3" />
                <span>YouTube</span>
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[2/1] bg-muted flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium line-clamp-2 mb-1">
                {link.title}
              </h3>
              
              {link.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {link.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isYouTube ? (
                  <Youtube className="w-3 h-3 text-red-500" />
                ) : (
                  <ExternalLink className="w-3 h-3" />
                )}
                <span className="truncate">{getDomain(link.url)}</span>
                <span>•</span>
                <Clock className="w-3 h-3" />
                <span>{formatDate(link.addedAt)}</span>
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={handleDeleteClick}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}