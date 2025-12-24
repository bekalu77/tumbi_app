import React from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  location: string;
  phone: string;
  joinedDate: Date;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  unit: string;
  location: string;
  mainCategory: string; // Renamed from listingType/category_slug
  subCategory: string;  // Renamed from category
  description: string;
  imageUrls: string[];
  createdAt: Date;
  sellerName: string;
  sellerId?: string;
  sellerPhone?: string;
  isVerified?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  slug: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  conversationId: string; 
  listingId: string;
  otherUserId: string;
  otherUserName: string;
  listingTitle: string;
  listingImage: string;
  lastMessage: string;
  lastMessageDate: Date;
  unreadCount?: number;
}

export type ViewState = 'home' | 'sell' | 'edit' | 'details' | 'saved' | 'messages' | 'chat-conversation' | 'profile' | 'register' | 'vendor-profile';
