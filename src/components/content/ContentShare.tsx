'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Share2, Twitter, Facebook, LinkedIn, Link, Copy, Check } from 'lucide-react';

interface ContentShareProps {
  contentId: string;
  title: string;
  description?: string;
}

export function ContentShare({ contentId, title, description }: ContentShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState<'twitter' | 'facebook' | 'linkedin'>('twitter');

  const contentUrl = `${window.location.origin}/content/${contentId}`;
  const shareText = `${title}${description ? ` - ${description}` : ''}`;

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(contentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(contentUrl)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(contentUrl)}&title=${encodeURIComponent(shareText)}`
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Content</DialogTitle>
          <DialogDescription>
            Share this content with your audience across different platforms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Share on</label>
            <Select value={platform} onValueChange={(value: 'twitter' | 'facebook' | 'linkedin') => setPlatform(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twitter">
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </div>
                </SelectItem>
                <SelectItem value="facebook">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </div>
                </SelectItem>
                <SelectItem value="linkedin">
                  <div className="flex items-center gap-2">
                    <LinkedIn className="w-4 h-4" />
                    LinkedIn
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Share Preview */}
          <Card className="p-4">
            <div className="space-y-2">
              <p className="font-medium">{title}</p>
              {description && (
                <p className="text-sm text-zinc-400">{description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Link className="w-4 h-4" />
                <span className="truncate">{contentUrl}</span>
              </div>
            </div>
          </Card>

          {/* Share Actions */}
          <div className="flex items-center gap-2">
            <Button
              className="flex-1"
              onClick={() => handleShare(platform)}
            >
              Share on {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 