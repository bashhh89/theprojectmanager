'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { diffWords } from 'diff';

interface ContentDiffProps {
  oldTitle: string;
  newTitle: string;
  oldContent: string;
  newContent: string;
  onBack: () => void;
}

interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export function ContentDiff({
  oldTitle,
  newTitle,
  oldContent,
  newContent,
  onBack,
}: ContentDiffProps) {
  const [titleDiff, setTitleDiff] = useState<DiffPart[]>([]);
  const [contentDiff, setContentDiff] = useState<DiffPart[]>([]);

  useEffect(() => {
    const titleChanges = diffWords(oldTitle, newTitle);
    const contentChanges = diffWords(oldContent, newContent);
    setTitleDiff(titleChanges);
    setContentDiff(contentChanges);
  }, [oldTitle, newTitle, oldContent, newContent]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Version Comparison</h2>
        <Button variant="outline" onClick={onBack}>
          <Icons.ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Title Changes</h3>
        <div className="space-y-2">
          {titleDiff.map((part, index) => (
            <span
              key={index}
              className={`${
                part.added
                  ? 'bg-green-100 text-green-800'
                  : part.removed
                  ? 'bg-red-100 text-red-800 line-through'
                  : ''
              }`}
            >
              {part.value}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Content Changes</h3>
        <div className="space-y-2">
          {contentDiff.map((part, index) => (
            <span
              key={index}
              className={`${
                part.added
                  ? 'bg-green-100 text-green-800'
                  : part.removed
                  ? 'bg-red-100 text-red-800 line-through'
                  : ''
              }`}
            >
              {part.value}
            </span>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
        <span className="flex items-center">
          <span className="mr-2 h-3 w-3 rounded bg-green-100"></span>
          Added
        </span>
        <span className="flex items-center">
          <span className="mr-2 h-3 w-3 rounded bg-red-100"></span>
          Removed
        </span>
      </div>
    </div>
  );
} 