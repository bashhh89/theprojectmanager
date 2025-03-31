import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface WizardProgressProps {
  steps: Array<{ id: string; title: string }>;
  currentStepId: string;
  completedSteps: string[];
}

export function WizardProgress({ steps, currentStepId, completedSteps }: WizardProgressProps) {
  return (
    <div className="mb-8">
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStepId;
          
          return (
            <React.Fragment key={step.id}>
              <div 
                className={`flex flex-col items-center ${
                  isCompleted ? 'text-blue-500' : 
                  isCurrent ? 'text-white' : 'text-gray-500'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isCompleted ? 'border-blue-500 bg-blue-500/20' :
                    isCurrent ? 'border-white' : 'border-gray-700'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-sm font-medium">{step.title}</div>
              </div>
              
              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <div 
                  className={`h-[2px] flex-1 mx-2 ${
                    completedSteps.includes(step.id) ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Mobile view - simplified dots */}
      <div className="flex md:hidden justify-center space-x-2 mb-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStepId;
          
          return (
            <div 
              key={step.id}
              className={`flex flex-col items-center`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isCompleted ? 'bg-blue-500' :
                  isCurrent ? 'bg-white' : 'bg-gray-700'
                }`}
              />
            </div>
          );
        })}
      </div>
      
      {/* Current step indicator for mobile */}
      <div className="block md:hidden text-center">
        <span className="text-sm text-gray-400">
          Step {steps.findIndex(s => s.id === currentStepId) + 1} of {steps.length}:
        </span>
        <span className="ml-2 text-white font-medium">
          {steps.find(s => s.id === currentStepId)?.title}
        </span>
      </div>
    </div>
  );
} 