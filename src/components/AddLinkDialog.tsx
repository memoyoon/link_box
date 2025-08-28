import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ImageIcon, Youtube, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { extractMetadata, extractQuickMetadata, extractYouTubeVideoId } from './utils/thumbnailExtractor';
import type { Link } from '../App';

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLink: (linkData: Omit<Link, 'id' | 'addedAt'>) => void;
}

interface MetadataState {
  title: string;
  description: string;
  thumbnail: string;
  isLoading: boolean;
  isAutoExtracted: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export function AddLinkDialog({ open, onOpenChange, onAddLink }: AddLinkDialogProps) {
  const [url, setUrl] = useState('');
  const [metadata, setMetadata] = useState<MetadataState>({
    title: '',
    description: '',
    thumbnail: '',
    isLoading: false,
    isAutoExtracted: false,
    hasError: false
  });

  const resetForm = () => {
    setUrl('');
    setMetadata({
      title: '',
      description: '',
      thumbnail: '',
      isLoading: false,
      isAutoExtracted: false,
      hasError: false
    });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const extractMetadataFromUrl = async (inputUrl: string) => {
    if (!inputUrl.trim()) return;
    
    let formattedUrl = inputUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    // 즉시 기본 정보 표시 (사용자 경험 향상)
    const quickMeta = extractQuickMetadata(formattedUrl);
    setMetadata(prev => ({
      ...prev,
      title: quickMeta.title,
      thumbnail: quickMeta.thumbnail || '',
      isLoading: true,
      hasError: false,
      errorMessage: undefined
    }));
    
    try {
      // 상세 메타데이터 추출
      const fullMetadata = await extractMetadata(formattedUrl);
      
      setMetadata(prev => ({
        ...prev,
        title: fullMetadata.title || quickMeta.title,
        description: fullMetadata.description || '',
        thumbnail: fullMetadata.thumbnail || quickMeta.thumbnail || '',
        isLoading: false,
        isAutoExtracted: true,
        hasError: !!fullMetadata.error,
        errorMessage: fullMetadata.error
      }));
    } catch (error) {
      console.error('메타데이터 추출 실패:', error);
      setMetadata(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
        errorMessage: '메타데이터를 가져올 수 없습니다'
      }));
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // URL이 유효해 보이면 자동으로 메타데이터 추출 시작
    if (newUrl && (newUrl.includes('.') || newUrl.startsWith('http'))) {
      const timeoutId = setTimeout(() => {
        extractMetadataFromUrl(newUrl);
      }, 500); // 500ms 디바운스
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleUrlBlur = () => {
    if (url && !metadata.isAutoExtracted && !metadata.isLoading) {
      extractMetadataFromUrl(url);
    }
  };

  const handleRefresh = () => {
    if (url) {
      extractMetadataFromUrl(url);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) return;

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // 제목이 없으면 URL에서 기본 제목 생성
    const finalTitle = metadata.title.trim() || formattedUrl;

    onAddLink({
      title: finalTitle,
      url: formattedUrl,
      description: metadata.description.trim() || undefined,
      thumbnail: metadata.thumbnail.trim() || undefined
    });

    resetForm();
  };

  const isValid = url.trim();
  const showYouTubeIndicator = url && isYouTubeUrl(url) && extractYouTubeVideoId(url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 링크 추가</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL 입력 */}
          <div className="space-y-2">
            <Label htmlFor="url">링크 주소 *</Label>
            <div className="relative">
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={handleUrlChange}
                onBlur={handleUrlBlur}
                required
              />
              {metadata.isLoading && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {showYouTubeIndicator && !metadata.isLoading && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Youtube className="w-4 h-4 text-red-500" />
                </div>
              )}
            </div>
            
            {/* 상태 표시 */}
            {metadata.isAutoExtracted && !metadata.hasError && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" />
                <span>메타데이터가 자동으로 가져와졌습니다</span>
              </div>
            )}
            
            {metadata.hasError && metadata.errorMessage && (
              <div className="flex items-center gap-2 text-xs text-amber-600">
                <AlertCircle className="w-3 h-3" />
                <span>{metadata.errorMessage}</span>
              </div>
            )}
            
            {showYouTubeIndicator && (
              <div className="flex items-center gap-2 text-xs text-red-600">
                <Youtube className="w-3 h-3" />
                <span>YouTube 썸네일이 자동으로 설정됩니다</span>
              </div>
            )}
          </div>

          {/* 미리보기 카드 */}
          {(metadata.title || metadata.thumbnail) && (
            <div className="border rounded-lg overflow-hidden bg-muted/30">
              {metadata.thumbnail && (
                <div className="aspect-[2/1] overflow-hidden">
                  <ImageWithFallback
                    src={metadata.thumbnail}
                    alt="미리보기"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {metadata.title && (
                      <h4 className="font-medium line-clamp-2 mb-1">
                        {metadata.title}
                      </h4>
                    )}
                    
                    {metadata.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {metadata.description}
                      </p>
                    )}
                  </div>
                  
                  {url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={metadata.isLoading}
                      className="shrink-0 w-8 h-8 p-0"
                    >
                      {metadata.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 제목 수정 (선택사항) */}
          <div className="space-y-2">
            <Label htmlFor="title">제목 수정 (선택사항)</Label>
            <Input
              id="title"
              placeholder="제목을 수정하려면 입력하세요"
              value={metadata.title}
              onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
              disabled={metadata.isLoading}
            />
          </div>

          {/* 설명 수정 (선택사항) */}
          <div className="space-y-2">
            <Label htmlFor="description">설명 수정 (선택사항)</Label>
            <Textarea
              id="description"
              placeholder="설명을 수정하거나 추가하려면 입력하세요"
              value={metadata.description}
              onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* 썸네일 수정 (선택사항) */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">썸네일 이미지 수정 (선택사항)</Label>
            <Input
              id="thumbnail"
              type="url"
              placeholder="다른 이미지 URL을 사용하려면 입력하세요"
              value={metadata.thumbnail}
              onChange={(e) => setMetadata(prev => ({ 
                ...prev, 
                thumbnail: e.target.value,
                isAutoExtracted: false 
              }))}
            />
          </div>

          {!metadata.title && !metadata.thumbnail && url && !metadata.isLoading && (
            <div className="p-3 bg-muted rounded-lg flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="w-4 h-4" />
              <span>URL을 완전히 입력하면 자동으로 제목과 이미지를 가져옵니다</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!isValid || metadata.isLoading}
              className="flex-1"
            >
              {metadata.isLoading ? '처리 중...' : '저장'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}