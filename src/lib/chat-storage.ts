
"use client";

import type { Conversation, Message, UserProfile } from "@/types";

const CONVERSATIONS_KEY = "eduai-conversations";
// Removed MAX_CONVERSATIONS_TO_STORE

export const getConversations = (): Conversation[] => {
  if (typeof window === "undefined") return [];
  try {
    const storedConversations = localStorage.getItem(CONVERSATIONS_KEY);
    return storedConversations ? JSON.parse(storedConversations) : [];
  } catch (error) {
    console.error("Error reading conversations from localStorage", error);
    return [];
  }
};

export const getConversationById = (id: string): Conversation | null => {
  const conversations = getConversations();
  return conversations.find(conv => conv.id === id) || null;
};

export const saveConversation = (conversationToSave: Conversation): void => {
  if (typeof window === "undefined") return;
  let conversations = getConversations();
  const existingIndex = conversations.findIndex(c => c.id === conversationToSave.id);

  if (existingIndex > -1) {
    conversations[existingIndex] = conversationToSave; // Update existing
  } else {
    conversations.unshift(conversationToSave); // Add new to the beginning (most recent)
  }

  // Sort by lastUpdatedAt to ensure the newest ones are at the beginning
  conversations.sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);

  // Removed pruning logic based on MAX_CONVERSATIONS_TO_STORE

  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Error saving conversation to localStorage. Quota might be exceeded.", error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error("localStorage quota exceeded. The new conversation or the total size of all conversations might be too large.");
        // Consider alerting the user that storage is full if this happens.
    }
  }
};

export const addMessageToConversation = (
  conversationId: string,
  topic: string, // Specific topic of this message exchange
  message: Message,
  profile?: UserProfile,
  subjectContext?: string, // Broader subject
  lessonContext?: string // Broader lesson
): Conversation => {
  let conversation = getConversationById(conversationId);
  if (!conversation) {
    conversation = {
      id: conversationId,
      topic: topic, // Store specific topic
      subjectContext: subjectContext,
      lessonContext: lessonContext,
      messages: [],
      lastUpdatedAt: Date.now(),
      studentProfile: profile,
    };
  }
  conversation.messages.push(message);
  conversation.lastUpdatedAt = Date.now();
  if (profile && !conversation.studentProfile) { 
    conversation.studentProfile = profile;
  }
  // Ensure context is updated if it wasn't there initially or changed
  if (subjectContext && conversation.subjectContext !== subjectContext) {
    conversation.subjectContext = subjectContext;
  }
  if (lessonContext && conversation.lessonContext !== lessonContext) {
    conversation.lessonContext = lessonContext;
  }
  saveConversation(conversation);
  return conversation;
};

export const formatConversationForAI = (messages: Message[]): string => {
  return messages
    .map(msg => `${msg.sender === 'user' ? 'Student' : 'AI Tutor'}: ${msg.text}`)
    .join('\n');
};

export const deleteConversation = (id: string): void => {
  if (typeof window === "undefined") return;
  let conversations = getConversations();
  conversations = conversations.filter(conv => conv.id !== id);
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Error deleting conversation from localStorage", error);
  }
};

export const updateConversationCustomTitle = (id: string, customTitle: string): void => {
  if (typeof window === "undefined") return;
  let conversations = getConversations(); 
  const conversationIndex = conversations.findIndex(conv => conv.id === id);
  if (conversationIndex > -1) {
    const conversationToUpdate = { 
      ...conversations[conversationIndex], 
      customTitle: customTitle,
      lastUpdatedAt: Date.now() // Also update timestamp
    };
    saveConversation(conversationToUpdate); 
  } else {
    console.warn(`Conversation with ID ${id} not found for renaming.`);
  }
};
