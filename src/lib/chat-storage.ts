
"use client";

import type { Conversation, Message, UserProfile } from "@/types";

const CONVERSATIONS_KEY = "eduai-conversations";
const MAX_CONVERSATIONS_TO_STORE = 30; // Limit the number of conversations

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

  // If we exceed the limit, remove the oldest ones (from the end of the sorted list)
  if (conversations.length > MAX_CONVERSATIONS_TO_STORE) {
    conversations = conversations.slice(0, MAX_CONVERSATIONS_TO_STORE);
  }

  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Error saving conversation to localStorage. Quota might be exceeded.", error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error("localStorage quota exceeded even after attempting to prune to MAX_CONVERSATIONS_TO_STORE. The remaining conversations might be too large individually or collectively, or the new conversation itself is too large.");
        // Advanced recovery: Could try removing the oldest item from the *current* `conversations` list
        // (which is already pruned to MAX_CONVERSATIONS_TO_STORE) and try saving again,
        // but this risks data loss of the item the user was just interacting with if it's the one causing the issue.
        // Or, could alert the user that storage is full.
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
    // No need to prune here as deletion inherently reduces size.
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Error deleting conversation from localStorage", error);
  }
};

export const updateConversationCustomTitle = (id: string, customTitle: string): void => {
  if (typeof window === "undefined") return;
  const conversations = getConversations(); // Get the potentially full list
  const conversationIndex = conversations.findIndex(conv => conv.id === id);
  if (conversationIndex > -1) {
    conversations[conversationIndex].customTitle = customTitle;
    conversations[conversationIndex].lastUpdatedAt = Date.now(); // Also update timestamp
    // Call saveConversation to handle sorting, pruning, and actual saving
    saveConversation(conversations[conversationIndex]); 
  } else {
    // If the conversation to update title for isn't found, we don't create a new one.
    // We could just re-save the existing list to ensure it's pruned if necessary,
    // but it's better to let saveConversation be called with an explicit item to save.
    // So, we might just save the current (potentially unpruned) list if no specific convo was being updated.
    // However, the current design calls saveConversation only when a specific convo is modified.
    // Let's stick to only saving if we actually found and modified it.
    // To be safe, one could re-save the entire (potentially just re-sorted) list here,
    // after ensuring pruning if needed.
    // For now, this only saves if an update happened.
    // The main save in `addMessageToConversation` will handle pruning.
     try {
      // Re-save the list. If an update was made to a convo that got pruned by another save, this might be an issue.
      // This path is less likely to be problematic if titles are updated for existing, recent conversations.
      const currentList = getConversations(); // Re-fetch to be safe, though ideally saveConversation handles all logic
      // No direct modification here, relies on other calls to saveConversation to prune.
      // This specific function primarily updates a title. If it's critical that this action *also* prunes,
      // then the saveConversation needs to be robust enough, or we re-save the whole list here.
      // Let's ensure saveConversation is robust.
      // Actually, we should be calling saveConversation with the modified item, not trying to re-save all.
      // The saveConversation now handles an item.
      // So:
      let convToUpdate = conversations.find(c => c.id === id);
      if(convToUpdate) {
        convToUpdate.customTitle = customTitle;
        convToUpdate.lastUpdatedAt = Date.now();
        saveConversation(convToUpdate); // This will handle placing it correctly and pruning if necessary
      }
    } catch (error)
      {
      console.error("Error updating conversation title in localStorage", error);
    }
  }
};

