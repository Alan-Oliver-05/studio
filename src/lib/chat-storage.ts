
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

export const saveConversation = (conversation: Conversation): void => {
  if (typeof window === "undefined") return;
  const conversations = getConversations();
  const existingIndex = conversations.findIndex(c => c.id === conversation.id);
  if (existingIndex > -1) {
    conversations[existingIndex] = conversation;
  } else {
    conversations.unshift(conversation); 
  }
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Error saving conversation to localStorage", error);
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
  const conversations = getConversations();
  const conversationIndex = conversations.findIndex(conv => conv.id === id);
  if (conversationIndex > -1) {
    conversations[conversationIndex].customTitle = customTitle;
    conversations[conversationIndex].lastUpdatedAt = Date.now(); // Also update timestamp
    try {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (error)
      {
      console.error("Error updating conversation title in localStorage", error);
    }
  }
};
