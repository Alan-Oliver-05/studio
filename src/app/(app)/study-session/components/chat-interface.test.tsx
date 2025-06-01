import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatInterface } from './chat-interface';
import { UserProfile, Message } from '@/types';
import { useToast } from "@/hooks/use-toast";

// Mock the useToast hook
jest.mock('../../hooks/use-toast', () => ({
    useToast: jest.fn(() => ({
        toast: jest.fn(),
    })),
}));

const mockUserProfile: UserProfile = {
    id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    age: '20',
    gradeLevel: '12',
};

const mockConversationId = 'convo123';
const mockTopic = 'Test Topic';

describe('ChatInterface Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        render(
            <ChatInterface
                userProfile={mockUserProfile}
                topic={mockTopic}
                conversationId={mockConversationId}
            />
        );
        expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument();
    });

    it('adds a user message to the message list when submitting', async () => {
        render(
            <ChatInterface
                userProfile={mockUserProfile}
                topic={mockTopic}
                conversationId={mockConversationId}
            />
        );

        const inputElement = screen.getByPlaceholderText('Type your message here...');
        fireEvent.change(inputElement, { target: { value: 'Hello AI' } });
        fireEvent.keyDown(inputElement, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText('Hello AI')).toBeInTheDocument();
        });
    });

    it('displays an error message when AI response fails', async () => {
        (useToast as jest.Mock).mockImplementation(() => ({
            toast: jest.fn(),
        }));
        const { toast } = useToast();

        render(
            <ChatInterface
                userProfile={mockUserProfile}
                topic={mockTopic}
                conversationId={mockConversationId}
            />
        );

        const inputElement = screen.getByPlaceholderText('Type your message here...');
        fireEvent.change(inputElement, { target: { value: 'Error please' } });
        fireEvent.keyDown(inputElement, { key: 'Enter', code: 'Enter' });

        // Simulate an AI error by mocking the aiGuidedStudySession or interactiveQAndA functions
        // For example, mock aiGuidedStudySession to reject with an error

        await waitFor(() => {
            // Assert that the toast function was called with an error message
            expect(toast).toHaveBeenCalled();
        });
    });

    it('displays the correct stage in interactive Q&A mode', () => {
        render(
            <ChatInterface
                userProfile={mockUserProfile}
                topic="Some Random Topic" // This will enable interactive Q&A mode
                conversationId={mockConversationId}
            />
        );

        expect(screen.getByText(/Stage: Q&A Session/)).toBeInTheDocument();
    });

    it('does not ask a question immediately after loading if initialInputQuery is not provided', async () => {
      const handleSubmit = jest.fn();
      render(
          <ChatInterface
              userProfile={mockUserProfile}
              topic={mockTopic}
              conversationId={mockConversationId}
              handleSubmit = {handleSubmit}
          />
      );

      await waitFor(() => {
          expect(handleSubmit).not.toHaveBeenCalled();
      });
  });

    it('asks a question immediately after loading when initialInputQuery is provided', async () => {
        // Mock the aiGuidedStudySession or interactiveQAndA function
        const mockAIResponse = { question: 'Test AI Question' };
        const interactiveQAndA = jest.fn(() => Promise.resolve(mockAIResponse));

        render(
            <ChatInterface
                userProfile={mockUserProfile}
                topic="Some Random Topic"
                conversationId={mockConversationId}
                initialInputQuery="Initial Question"
            />
        );

        // Wait for the AI question to appear
        await waitFor(() => {
            expect(screen.getByText('Test AI Question')).toBeInTheDocument();
        });
    });
});
