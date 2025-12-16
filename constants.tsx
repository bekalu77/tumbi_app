import React from 'react';
import { Listing, Category } from './types';
import { HammerIcon, WrenchIcon, TruckIcon, HomeIcon } from './components/Icons';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'All', slug: 'all', icon: <HomeIcon className="w-5 h-5" /> },
  { id: '2', name: 'Materials', slug: 'materials', icon: <HammerIcon className="w-5 h-5" /> },
  { id: '3', name: 'Services', slug: 'services', icon: <WrenchIcon className="w-5 h-5" /> },
  { id: '4', name: 'Equipment', slug: 'equipment', icon: <TruckIcon className="w-5 h-5" /> },
];

export const PRODUCT_CATEGORIES = [
  { value: 'materials', label: 'Construction Materials' },
  { value: 'tools', label: 'Hand Tools & Power Tools' },
  { value: 'electrical', label: 'Electrical Supplies' },
  { value: 'plumbing', label: 'Plumbing Supplies' },
  { value: 'fixtures', label: 'Fixtures & Fittings' },
  { value: 'safety', label: 'Safety Gear' },
];

export const SERVICE_CATEGORIES = [
  { value: 'labor', label: 'General Labor' },
  { value: 'skilled', label: 'Skilled Trades (Plumbing, Electrician)' },
  { value: 'consultation', label: 'Consultation & Design' },
  { value: 'rental', label: 'Equipment Rental' },
  { value: 'maintenance', label: 'Repair & Maintenance' },
];

export const MEASUREMENT_UNITS = [
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'bag', label: 'Bags' },
    { value: 'ton', label: 'Tons' },
    { value: 'm', label: 'Meters' },
    { value: 'sqm', label: 'Square Meters' },
    { value: 'hr', label: 'Hour (Service)' },
    { value: 'day', label: 'Day (Rental/Service)' },
    { value: 'job', label: 'Per Job/Contract' },
    { value: 'trip', label: 'Per Trip' },
];
