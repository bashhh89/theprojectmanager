import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { LeadCard } from './LeadCard';

// Interface for lead objects
interface Lead {
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
}

interface KanbanColumnProps {
  id: string;
  title: string;
  description?: string;
  iconElement?: React.ReactNode;
  colorClass?: string;
  leads: Lead[];
  onEdit: (lead: Lead) => void;
}

export function KanbanColumn({
  id,
  title,
  description,
  iconElement,
  colorClass = 'bg-blue-500',
  leads,
  onEdit
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div 
      ref={setNodeRef}
      className="kanban-column flex-1 min-w-[280px] bg-card border rounded-lg shadow-sm"
    >
      <div className="flex items-center p-3 border-b">
        {iconElement && (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${colorClass} mr-2 shadow-sm`}>
            {iconElement}
          </div>
        )}
        <h3 className="font-medium text-base">{title}</h3>
        <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground px-3 py-2 bg-muted/30 border-b">{description}</p>
      )}
      
      <SortableContext
        items={leads.map(lead => lead.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="p-2 kanban-cards space-y-2 h-[calc(100%-56px)] overflow-y-auto overflow-x-hidden custom-scrollbar">
          {leads.length === 0 ? (
            <div className="flex items-center justify-center h-24 border border-dashed rounded-md text-muted-foreground text-sm">
              No leads yet
            </div>
          ) : (
            leads.map((lead) => (
              <LeadCard 
                key={lead.id} 
                lead={lead} 
                onEdit={onEdit} 
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
} 