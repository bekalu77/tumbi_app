import React from 'react';
import { Category } from './types';
import { HammerIcon, HomeIcon, ServicesIcon, MaterialsIcon, RentalIcon, WrenchIcon, TruckIcon } from './components/Icons';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'All Categories', slug: 'all', icon: <HomeIcon className="w-5 h-5" /> },
  { id: '2', name: 'Construction Materials', slug: 'materials', icon: <MaterialsIcon className="w-5 h-5" /> },
  { id: '3', name: 'Skilled Services', slug: 'services', icon: <WrenchIcon className="w-5 h-5" /> },
  { id: '4', name: 'Equipment & Tool Rental', slug: 'rentals', icon: <TruckIcon className="w-5 h-5" /> },
  { id: '5', name: 'Finishing & Interior', slug: 'finishing', icon: <HammerIcon className="w-5 h-5" /> },
];

export const SUB_CATEGORIES: Record<string, { value: string, label: string }[]> = {
  materials: [
    { value: 'cement', label: 'Cement & Concrete' },
    { value: 'steel', label: 'Steel & Rebar' },
    { value: 'bricks', label: 'Bricks, Blocks & HCB' },
    { value: 'sand', label: 'Sand & Aggregates' },
    { value: 'roofing', label: 'Roofing Sheets & Tiles' },
    { value: 'wood', label: 'Timber & Formwork' },
  ],
  services: [
    { value: 'plumbing', label: 'Plumbing & Sanitary' },
    { value: 'electrical', label: 'Electrical Installation' },
    { value: 'masonry', label: 'Masonry & Concrete Work' },
    { value: 'painting', label: 'Painting & Gypsum' },
    { value: 'design', label: 'Architecture & Design' },
    { value: 'carpentry', label: 'Carpentry & Joinery' },
  ],
  rentals: [
    { value: 'excavation', label: 'Excavators & Loaders' },
    { value: 'lifting', label: 'Cranes & Hoists' },
    { value: 'tools', label: 'Hand & Power Tools' },
    { value: 'transport', label: 'Trucks & Logistics' },
    { value: 'scaffolding', label: 'Scaffolding & Props' },
  ],
  finishing: [
    { value: 'tiles', label: 'Tiles & Flooring' },
    { value: 'windows', label: 'Windows & Doors' },
    { value: 'lighting', label: 'Lighting Fixtures' },
    { value: 'sanitaryware', label: 'Kitchen & Bath Fixtures' },
    { value: 'cabinets', label: 'Kitchen Cabinets' },
  ]
};

export const ETHIOPIAN_CITIES = [
  'Addis Ababa',
  'Adama',
  'Bahir Dar',
  'Bishoftu',
  'Debre Berhan',
  'Dessie',
  'Dire Dawa',
  'Gondar',
  'Hawassa',
  'Jimma',
  'Mekelle',
  'Shashamane',
  'Sodo',
  'Arba Minch',
  'Hosaena',
  'Jijiga',
  'Asosa',
  'Gambela',
  'Semera'
];

export const MEASUREMENT_UNITS = [
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'bag', label: 'Bags' },
    { value: 'ton', label: 'Tons' },
    { value: 'm', label: 'Meters' },
    { value: 'sqm', label: 'Square Meters' },
    { value: 'hr', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'job', label: 'Per Job' },
    { value: 'trip', label: 'Per Trip' },
];

// Keep these for backward compatibility during migration
export const PRODUCT_CATEGORIES = SUB_CATEGORIES.materials;
export const SERVICE_CATEGORIES = SUB_CATEGORIES.services;
