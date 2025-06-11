
"use client";

import type { Conversation, Message, UserProfile } from "@/types";

const CONVERSATIONS_KEY = "eduai-conversations";

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

  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Error saving conversation to localStorage:", error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn(
            "LocalStorage quota exceeded when trying to save conversations. " +
            "The total size of all conversations, or this specific conversation, might be too large. " +
            "Consider managing conversations in the Library page if this issue persists."
        );
    }
  }
};

export const addMessageToConversation = (
  conversationId: string,
  topic: string, 
  message: Message,
  profile?: UserProfile,
  subjectContext?: string, 
  lessonContext?: string 
): Conversation => {
  let conversation = getConversationById(conversationId);
  if (!conversation) {
    conversation = {
      id: conversationId,
      topic: topic, 
      subjectContext: subjectContext,
      lessonContext: lessonContext,
      messages: [],
      lastUpdatedAt: Date.now(),
      studentProfile: profile,
      currentMindMapImageUri: null, // Initialize new field
    };
  }
  conversation.messages.push(message);
  conversation.lastUpdatedAt = Date.now();
  if (profile && !conversation.studentProfile) { 
    conversation.studentProfile = profile;
  }
  if (subjectContext && conversation.subjectContext !== subjectContext) {
    conversation.subjectContext = subjectContext;
  }
  if (lessonContext && conversation.lessonContext !== lessonContext) {
    conversation.lessonContext = lessonContext;
  }

  // Store image URI if in mind map mode and user uploads an image
  if (topic === "Visual Learning - Mind Maps" && message.sender === 'user' && message.attachmentPreview) {
    conversation.currentMindMapImageUri = message.attachmentPreview;
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

export const deleteAllConversations = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CONVERSATIONS_KEY);
    console.log("All chat history cleared from localStorage.");
  } catch (error) {
    console.error("Error clearing all conversations from localStorage", error);
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
      lastUpdatedAt: Date.now() 
    };
    saveConversation(conversationToUpdate); 
  } else {
    console.warn(`Conversation with ID ${id} not found for renaming.`);
  }
};
