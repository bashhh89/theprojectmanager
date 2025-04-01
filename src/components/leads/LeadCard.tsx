import React from 'react';
import { formatDate } from '@/lib/utils';
import { Clock, PenLine, User } from 'lucide-react';

export interface LeadCardProps {
  lead: {
    id: string;
    name: string;
    email: string;
    initial_message?: string;
    notes?: string;
    created_at: string;
    status: string;
    source: string;
    agents?: {
      id: string;
      name: string;
    };
  };
  onEdit: (lead: any) => void;
}

export function LeadCard({ lead, onEdit }: LeadCardProps) {
  // Truncate a string with ellipsis if it exceeds the character limit
  const truncate = (text: string = "", limit: number = 100) => {
    if (text.length <= limit) return text;
    return text.slice(0, limit) + "...";
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-card rounded-md border shadow-sm hover:border-primary/20">
      <div className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
              {getInitials(lead.name)}
            </div>
            <h3 className="font-medium text-sm line-clamp-1">{lead.name}</h3>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(lead);
            }}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
          >
            <PenLine size={14} />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground line-clamp-2 pb-1 border-b border-dashed border-muted">
          {truncate(lead.initial_message || lead.notes || "No details available")}
        </div>
        
        <div className="mt-2 flex justify-between items-center">
          <div className="flex items-center">
            <Clock size={12} className="text-muted-foreground mr-1" />
            <span className="text-xs text-muted-foreground">{formatDate(lead.created_at)}</span>
          </div>
          {lead.agents?.name ? (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center">
              <User size={10} className="mr-1" />
              {lead.agents.name}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
} 