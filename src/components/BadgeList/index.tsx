import React from 'react';
import Image from 'next/image';
import { Badge } from '@/types/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export interface BadgeListProps {
  badges: Badge[];
  isLoading?: boolean;
  onDelete?: (badgeId: string) => void;
}

const defaultBadgeImage = '/badges/default-badge.png';

const MobileBadgeList = ({ badges, isLoading, onDelete }: BadgeListProps) => {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {badges.map((badge) => (
        <Card key={badge.id} className="relative">
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={() => onDelete(badge.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <CardContent className="p-4 flex flex-col items-center">
            <div className="relative w-20 h-20 mb-2">
              {badge.imageUrl ? (
                <Image
                  src={badge.imageUrl}
                  alt={badge.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                  <span className="text-2xl">🏆</span>
                </div>
              )}
            </div>
            <h3 className="text-sm font-semibold text-center">{badge.name}</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">
              {badge.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const DesktopBadgeList = ({ badges, isLoading, onDelete }: BadgeListProps) => {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-6">
      {badges.map((badge) => (
        <Card key={badge.id} className="relative group">
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onDelete(badge.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <CardContent className="p-6 flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              {badge.imageUrl ? (
                <Image
                  src={badge.imageUrl}
                  alt={badge.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                  <span className="text-4xl">🏆</span>
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-center">{badge.name}</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {badge.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface BadgeListComponent extends React.FC<BadgeListProps> {
  Mobile: React.FC<BadgeListProps>;
  Desktop: React.FC<BadgeListProps>;
}

const BadgeList: BadgeListComponent = ({ badges, isLoading, onDelete }) => {
  return <DesktopBadgeList badges={badges} isLoading={isLoading} onDelete={onDelete} />;
};

BadgeList.Mobile = MobileBadgeList;
BadgeList.Desktop = DesktopBadgeList;

export default BadgeList; 