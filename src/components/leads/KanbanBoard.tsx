import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot
} from '@hello-pangea/dnd';
import { usePipelineStore } from '@/store/pipelineStore';
import { KanbanColumn } from './KanbanColumn';
import { LeadCard } from './LeadCard';
import { AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

// Define supported statuses
type SupportedStatus = "new" | "contacted" | "qualified" | "converted" | "closed";

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

interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onLeadMove?: (leadId: string, newStatus: string) => void;
}

export function KanbanBoard({ leads, onLeadClick, onLeadMove }: KanbanBoardProps) {
  const { pipelines } = usePipelineStore();
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);

  // Group leads by status
  const leadsByStatus = useMemo(() => {
    const result: Record<string, Lead[]> = {};
    
    // Initialize all status columns
    pipelines.forEach(pipeline => {
      result[pipeline.id] = [];
    });
    
    // Group leads by status
    leads.forEach(lead => {
      if (result[lead.status]) {
        result[lead.status].push(lead);
      } else {
        // If status doesn't match any column, put in first column
        result[pipelines[0]?.id || 'new'].push({
          ...lead,
          status: pipelines[0]?.id || 'new',
        });
      }
    });
    
    return result;
  }, [leads, pipelines]);

  // Handle scroll visibility indicators
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setShowLeftIndicator(scrollLeft > 10);
    setShowRightIndicator(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Check initial state
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const autoScroll = (clientX: number) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const scrollSpeed = 15;
    
    // Auto-scroll zone is 100px from edges
    const scrollZone = 100;
    
    if (clientX < containerRect.left + scrollZone) {
      // Scroll left
      container.scrollLeft -= scrollSpeed;
    } else if (clientX > containerRect.right - scrollZone) {
      // Scroll right
      container.scrollLeft += scrollSpeed;
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    document.body.style.cursor = '';
    
    // If there's no destination or the item was dropped in its original location
    if (!result.destination || result.destination.droppableId === result.source.droppableId) {
      return;
    }

    // Update the lead's status
    if (onLeadMove) {
      const newStatus = result.destination.droppableId;
      onLeadMove(result.draggableId, newStatus);
    }
  };

  const getStatusIcon = (statusId: string) => {
    switch(statusId) {
      case 'new':
        return <AlertCircle size={14} className="text-white" />;
      case 'contacted':
        return <Clock size={14} className="text-white" />;
      case 'qualified':
        return <CheckCircle size={14} className="text-white" />;
      case 'converted':
        return <CheckCircle size={14} className="text-white" />;
      case 'closed':
        return <X size={14} className="text-white" />;
      default:
        return <AlertCircle size={14} className="text-white" />;
    }
  };

  const getStatusColor = (statusId: string) => {
    switch(statusId) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'qualified': return 'bg-purple-500';
      case 'converted': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="h-full relative overflow-hidden">
      {/* Left scroll indicator */}
      {showLeftIndicator && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      )}
      
      {/* Right scroll indicator */}
      {showRightIndicator && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      )}
      
      <div 
        ref={containerRef} 
        className="h-full overflow-x-auto scrollbar-thin pb-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 py-4 px-4 min-h-full min-w-max">
            {pipelines.map((pipeline) => (
              <div key={pipeline.id} className="flex-1 min-w-[280px]">
                <Droppable droppableId={pipeline.id}>
                  {(provided: DroppableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="kanban-column bg-card border rounded-lg shadow-sm h-full"
                    >
                      <div className="flex items-center p-3 border-b">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getStatusColor(pipeline.id)} mr-2 shadow-sm`}>
                          {getStatusIcon(pipeline.id)}
                        </div>
                        <h3 className="font-medium text-base">{pipeline.name}</h3>
                        <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                          {leadsByStatus[pipeline.id]?.length || 0}
                        </span>
                      </div>
                      
                      {pipeline.description && (
                        <p className="text-xs text-muted-foreground px-3 py-2 bg-muted/30 border-b">{pipeline.description}</p>
                      )}
                      
                      <div className="p-2 space-y-2 h-[calc(100%-56px)] overflow-y-auto overflow-x-hidden custom-scrollbar">
                        {leadsByStatus[pipeline.id]?.length === 0 ? (
                          <div className="flex items-center justify-center h-24 border border-dashed rounded-md text-muted-foreground text-sm">
                            No leads yet
                          </div>
                        ) : (
                          leadsByStatus[pipeline.id]?.map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`${snapshot.isDragging ? 'opacity-80 transform scale-105' : ''}`}
                                >
                                  <LeadCard lead={lead} onEdit={() => onLeadClick(lead)} />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
} 