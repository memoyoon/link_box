import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from './components/ui/button';
import { LinkList } from './components/LinkList';
import { AddLinkDialog } from './components/AddLinkDialog';

export interface Link {
  id: string;
  title: string;
  url: string;
  description?: string;
  thumbnail?: string;
  addedAt: Date;
}

export default function App() {
  const [links, setLinks] = useState<Link[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // 로컬 스토리지에서 링크 불러오기
  useEffect(() => {
    const savedLinks = localStorage.getItem('saved-links');
    if (savedLinks) {
      try {
        const parsedLinks = JSON.parse(savedLinks).map((link: any) => ({
          ...link,
          addedAt: new Date(link.addedAt)
        }));
        setLinks(parsedLinks);
      } catch (error) {
        console.error('링크 데이터를 불러오는 중 오류가 발생했습니다:', error);
      }
    }
  }, []);

  // 로컬 스토리지에 링크 저장
  const saveLinksToStorage = (newLinks: Link[]) => {
    localStorage.setItem('saved-links', JSON.stringify(newLinks));
  };

  // 새 링크 추가
  const addLink = (linkData: Omit<Link, 'id' | 'addedAt'>) => {
    const newLink: Link = {
      ...linkData,
      id: Date.now().toString(),
      addedAt: new Date()
    };
    
    const updatedLinks = [newLink, ...links];
    setLinks(updatedLinks);
    saveLinksToStorage(updatedLinks);
    setShowAddDialog(false);
  };

  // 링크 삭제
  const deleteLink = (id: string) => {
    const updatedLinks = links.filter(link => link.id !== id);
    setLinks(updatedLinks);
    saveLinksToStorage(updatedLinks);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-medium">내 링크 모음</h1>
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="rounded-full w-10 h-10 p-0"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6">
        {links.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium mb-2">아직 저장된 링크가 없어요</h2>
            <p className="text-muted-foreground mb-6">
              중요한 링크들을 모아서 언제든 쉽게 찾아보세요
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              첫 번째 링크 추가하기
            </Button>
          </div>
        ) : (
          <LinkList links={links} onDeleteLink={deleteLink} />
        )}
      </main>

      {/* 링크 추가 다이얼로그 */}
      <AddLinkDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddLink={addLink}
      />
    </div>
  );
}