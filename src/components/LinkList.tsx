import React from 'react';
import { LinkCard } from './LinkCard';
import type { Link } from '../App';

interface LinkListProps {
  links: Link[];
  onDeleteLink: (id: string) => void;
}

export function LinkList({ links, onDeleteLink }: LinkListProps) {
  return (
    <div className="space-y-4">
      {links.map((link) => (
        <LinkCard
          key={link.id}
          link={link}
          onDelete={() => onDeleteLink(link.id)}
        />
      ))}
    </div>
  );
}