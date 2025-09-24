'use client';

import { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle } from 'lucide-react';
import { ActionButton } from './ActionButton';
import { submitReceiptToBounty, getBountyTaskInputs, processTaskResults } from '@/lib/agent-interactions';
import { minikit } from '@/lib/minikit';

interface ReceiptSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bountyId: string;
  onSuccess?: () => void;
}

export function ReceiptSubmissionModal({
  isOpen,
  onClose,
  bountyId,
  onSuccess
}: ReceiptSubmissionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'loading' | 'tasks' | 'processing' | 'submit' | 'success'>('loading');
  const [taskInputs, setTaskInputs] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [resultURI, setResultURI] = useState('');

  useEffect(() => {
    if (isOpen && bountyId) {
      loadTaskInputs();
    }
  }, [isOpen, bountyId]);

  const loadTaskInputs = async () => {
    setStep('loading');
    try {
      const inputs = await getBountyTaskInputs(bountyId);
      setTaskInputs(inputs);
      setStep('tasks');
    } catch (error) {
      console.error('Failed to load task inputs:', error);
      alert('Failed to load bounty tasks');
      onClose();
    }
  };

  const handleProcessTasks = async () => {
    setStep('processing');
    try {
      const processedResults = await processTaskResults(taskInputs);
      setResults(processedResults);
      setStep('submit');
    } catch (error) {
      console.error('Failed to process tasks:', error);
      alert('Failed to process tasks');
      setStep('tasks');
    }
  };

  const handleSubmitReceipt = async () => {
    setIsLoading(true);
    try {
      const receiptURI = await submitReceiptToBounty(bountyId, [], results, resultURI);
      console.log('Receipt submitted:', receiptURI);
      setStep('success');
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit receipt:', error);
      alert('Failed to submit receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setStep('loading');
    setTaskInputs([]);
    setResults([]);
    setResultURI('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-lg border-b border-border">
          <h2 className="text-heading font-semibold text-fg">
            {step === 'loading' && 'Loading Bounty Tasks...'}
            {step === 'tasks' && 'Review Tasks'}
            {step === 'processing' && 'Processing Tasks...'}
            {step === 'submit' && 'Submit Receipt'}
            {step === 'success' && 'Receipt Submitted!'}
          </h2>
          <button
            onClick={handleClose}
            className="p-xs rounded-sm hover:bg-muted transition-colors"
            disabled={isLoading}
          >
            <X className="w-md h-md text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-lg space-y-lg">
          {step === 'loading' && (
            <div className="text-center py-xl">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-md"></div>
              <p className="text-body text-text-muted">Loading bounty tasks...</p>
            </div>
          )}

          {step === 'tasks' && (
            <div className="space-y-lg">
              <div className="text-body text-text-muted">
                Review the tasks for bounty #{bountyId}. Click "Process Tasks" to generate results.
              </div>

              <div className="space-y-md">
                {taskInputs.map((task, index) => (
                  <div key={index} className="glass-card p-md">
                    <div className="flex items-start space-x-md">
                      <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-fg mb-xs">
                          Task {index + 1}: {task.type.toUpperCase()}
                        </h4>
                        <p className="text-body text-text-muted">{task.content}</p>
                        {task.metadata && (
                          <div className="mt-sm text-caption text-text-muted">
                            Difficulty: {task.metadata.difficulty}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-xl">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-md"></div>
              <p className="text-body text-text-muted">Processing tasks with AI agent...</p>
              <p className="text-caption text-text-muted mt-xs">
                This may take a few moments depending on task complexity.
              </p>
            </div>
          )}

          {step === 'submit' && (
            <div className="space-y-lg">
              <div className="text-body text-text-muted">
                Tasks processed successfully! Review the results and submit your receipt.
              </div>

              <div className="space-y-md">
                {results.map((result, index) => (
                  <div key={index} className="glass-card p-md">
                    <div className="flex items-start space-x-md">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-fg mb-xs">
                          Result {index + 1}
                        </h4>
                        <p className="text-body text-text-muted mb-sm">{result.output}</p>
                        <div className="flex items-center space-x-md text-caption text-text-muted">
                          <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
                          <span>Processing time: {result.metadata.processingTime.toFixed(0)}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-sm">
                <label className="block text-body font-medium text-fg">
                  Result URI (optional)
                </label>
                <input
                  type="url"
                  value={resultURI}
                  onChange={(e) => setResultURI(e.target.value)}
                  className="w-full px-md py-sm bg-surface border border-border rounded-md text-fg placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="https://example.com/results.json"
                />
                <p className="text-caption text-text-muted">
                  Provide a link to additional result data or files.
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-lg">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h3 className="text-heading font-semibold text-fg mb-sm">
                  Receipt Submitted Successfully!
                </h3>
                <p className="text-body text-text-muted">
                  Your work has been submitted for bounty #{bountyId}.
                  The bounty creator will review and approve the results.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-md p-lg border-t border-border">
          {step === 'tasks' && (
            <>
              <ActionButton variant="secondary" onClick={handleClose}>
                Cancel
              </ActionButton>
              <ActionButton variant="primary" onClick={handleProcessTasks}>
                Process Tasks
              </ActionButton>
            </>
          )}

          {step === 'submit' && (
            <>
              <ActionButton variant="secondary" onClick={() => setStep('tasks')}>
                Back
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={handleSubmitReceipt}
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Receipt'}
              </ActionButton>
            </>
          )}

          {step === 'success' && (
            <ActionButton variant="primary" onClick={handleClose}>
              Done
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}

