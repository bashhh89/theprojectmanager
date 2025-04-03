'use client';

import { useState } from 'react';
import { useContent } from '@/hooks/useContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ContentSchedulerProps {
  contentId: string;
  onSchedule?: () => void;
}

export function ContentScheduler({ contentId, onSchedule }: ContentSchedulerProps) {
  const { updateContent } = useContent();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('09:00');
  const [timezone, setTimezone] = useState('UTC');

  const handleSchedule = async () => {
    if (!date) return;

    const [hours, minutes] = time.split(':').map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes, 0, 0);

    try {
      await updateContent({
        id: contentId,
        metadata: {
          scheduled_publish: {
            date: scheduledDate.toISOString(),
            timezone
          }
        }
      });

      onSchedule?.();
    } catch (error) {
      console.error('Error scheduling content:', error);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Schedule Publication</h3>
          <p className="text-sm text-zinc-400">
            Choose when you want your content to be published.
          </p>
        </div>

        <div className="space-y-4">
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium mb-2">Publication Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-sm font-medium mb-2">Publication Time</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Schedule Button */}
          <Button
            className="w-full"
            onClick={handleSchedule}
            disabled={!date}
          >
            Schedule Publication
          </Button>
        </div>
      </div>
    </Card>
  );
} 