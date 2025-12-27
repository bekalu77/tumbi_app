import React from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  location: string;
  phone: string;
  companyName?: string;
  profileImage?: string;
  isVerified?: boolean;
  joinedDate: Date;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  unit: string;
  location: string;
  mainCategory: string;
  subCategory: string;
  description: string;
  imageUrls: string[];
  createdAt: Date;
  sellerName: string;
  sellerId?: string;
  sellerPhone?: string;
  sellerImage?: string;
  sellerCompanyName?: string;
  isVerified?: boolean;
  status?: string;
  views?: number;
  shareSlug?: string;
  contactPhone?: string;
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
  is_read?: boolean;
}

export interface ChatSession {
  conversationId: string; 
  listingId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserImage?: string;
  listingTitle: string;
  listingImage: string;
  lastMessage: string;
  lastMessageDate: Date;
  unreadCount?: number;
}

export type ViewState = 'home' | 'sell' | 'edit' | 'details' | 'saved' | 'messages' | 'chat-conversation' | 'profile' | 'register' | 'vendor-profile';
