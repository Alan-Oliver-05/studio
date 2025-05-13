
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
    conversations.unshift(conversation); // Add new conversations to the beginning
  }
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Error saving conversation to localStorage", error);
  }
};

export const addMessageToConversation = (
  conversationId: string,
  topic: string,
  message: Message,
  profile?: UserProfile
): Conversation => {
  let conversation = getConversationById(conversationId);
  if (!conversation) {
    conversation = {
      id: conversationId,
      topic: topic,
      messages: [],
      lastUpdatedAt: Date.now(),
      studentProfile: profile, // Store profile with new conversation
    };
  }
  conversation.messages.push(message);
  conversation.lastUpdatedAt = Date.now();
  if (profile && !conversation.studentProfile) { // Update profile if it was missing
    conversation.studentProfile = profile;
  }
  saveConversation(conversation);
  return conversation;
};

export const formatConversationForAI = (messages: Message[]): string => {
  return messages
    .map(msg => `${msg.sender === 'user' ? 'Student' : 'AI Tutor'}: ${msg.text}`)
    .join('\n');
};
