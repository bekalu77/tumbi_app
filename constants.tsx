import React from 'react';
import { Category } from './types';
import { HammerIcon, HomeIcon, ServicesIcon, MaterialsIcon, RentalIcon, WrenchIcon, TruckIcon } from './components/Icons';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'All Categories', slug: 'all', icon: <HomeIcon className="w-5 h-5" /> },

  { id: '2', name: 'Construction Materials', slug: 'materials', icon: <MaterialsIcon className="w-5 h-5" /> },

  { id: '3', name: 'MEP Supplies', slug: 'mep', icon: <WrenchIcon className="w-5 h-5" /> },

  { id: '4', name: 'Finishing & Interior', slug: 'finishing', icon: <HammerIcon className="w-5 h-5" /> },

  { id: '5', name: 'Skilled Services', slug: 'services', icon: <ServicesIcon className="w-5 h-5" /> },

  { id: '6', name: 'Equipment & Tool Rental', slug: 'rentals', icon: <TruckIcon className="w-5 h-5" /> },

  { id: '7', name: 'Site Safety & Accessories', slug: 'safety', icon: <TruckIcon className="w-5 h-5" /> },

  { id: '8', name: 'Heavy Machinery & Vehicles', slug: 'machinery', icon: <TruckIcon className="w-5 h-5" /> },

  { id: '9', name: 'Other & Miscellaneous', slug: 'other', icon: <HomeIcon className="w-5 h-5" /> },
];

export const SUB_CATEGORIES: Record<string, { value: string, label: string }[]> = {

  // -----------------------------------
  // CONSTRUCTION MATERIALS
  // -----------------------------------
  materials: [
    { value: 'cement', label: 'Cement & Concrete' },
    { value: 'steel_rebar', label: 'Steel & Rebar' },
    { value: 'masonry', label: 'Bricks, HCB & Blocks' },
    { value: 'sand_agg', label: 'Sand & Aggregates' },
    { value: 'asphalt', label: 'Asphalt & Road Base' },
    { value: 'roofing', label: 'Roofing Sheets & Tiles' },
    { value: 'wood', label: 'Timber & Formwork Materials' },
    { value: 'waterproofing', label: 'Waterproofing Membrane & Sealants' },
    { value: 'chemicals', label: 'Construction Chemicals & Admixtures' },
    { value: 'glass', label: 'Glass & Glazing' },
    { value: 'foundation', label: 'Foundation Reinforcement Materials' },
    { value: 'geotextile', label: 'Geotextiles & Geo-membranes' },
    { value: 'other', label: 'Other Construction Materials' },
  ],

  // -----------------------------------
  // MEP — Mechanical, Electrical & Plumbing
  // -----------------------------------
  mep: [
    // Plumbing
    { value: 'pvc_pipes', label: 'PVC Pipes & Fittings' },
    { value: 'hdpe', label: 'HDPE Pipes & Fittings' },
    { value: 'water_tanks', label: 'Water Tanks' },
    { value: 'pumps', label: 'Water Pumps' },

    // Electrical
    { value: 'electrical_cables', label: 'Cables & Electrical Wiring' },
    { value: 'lighting_elec', label: 'Electrical Lighting Fixtures' },
    { value: 'switches', label: 'Switches, Sockets & DB Boards' },
    { value: 'generators', label: 'Generators & Backup Power' },

    // Mechanical / HVAC
    { value: 'hvac', label: 'HVAC & AC Parts' },
    { value: 'ducting', label: 'Ducting Materials' },
    { value: 'valves', label: 'Industrial Valves & Fittings' },

    { value: 'other', label: 'Other MEP Items' }
  ],

  // -----------------------------------
  // SERVICES
  // -----------------------------------
  services: [
    { value: 'architects', label: 'Architecture & Design' },
    { value: 'structural', label: 'Structural Engineering' },
    { value: 'land_survey', label: 'Land Surveying' },
    { value: 'construction_services', label: 'General Construction Works' },
    { value: 'masonry', label: 'Masonry Work' },
    { value: 'rebar_bending', label: 'Rebar Bending' },
    { value: 'installation_professionals', label: 'Installation Professionals' },
    { value: 'plumbing_service', label: 'Plumbing Installation' },
    { value: 'electrical_service', label: 'Electrical Installation' },
    { value: 'painting_service', label: 'Painting & Gypsum' },
    { value: 'tile_install', label: 'Tile & Flooring Work' },
    { value: 'carpentry', label: 'Carpentry & Joinery' },
    { value: 'metalwork', label: 'Metal Work & Welding' },
    { value: 'interior_design', label: 'Interior Design & Furniture' },
    { value: 'landscaping', label: 'Landscaping & Gardening' },
    { value: 'other', label: 'Other Services' },
  ],

  // -----------------------------------
  // EQUIPMENT RENTAL
  // -----------------------------------
  rentals: [
    { value: 'excavators', label: 'Excavators & Loaders' },
    { value: 'cranes', label: 'Cranes & Hoists' },
    { value: 'mixers', label: 'Concrete Mixers' },
    { value: 'compact', label: 'Compaction Tools' },
    { value: 'power_tools', label: 'Hand & Power Tools' },
    { value: 'transport', label: 'Transport Trucks' },
    { value: 'scaffolding', label: 'Scaffolding & Props' },
    { value: 'other', label: 'Other Rental Equipment' },
  ],

  // -----------------------------------
  // FINISHING
  // -----------------------------------
  finishing: [
    { value: 'tiles', label: 'Tiles & Flooring' },
    { value: 'paint', label: 'Paints & Coatings' },
    { value: 'gypsum_board', label: 'Gypsum Board & Ceilings' },
    { value: 'sanitary', label: 'Sanitary Ware' },
    { value: 'kitchen', label: 'Kitchen Cabinets & Accessories' },
    { value: 'doors', label: 'Doors & Windows' },
    { value: 'decor', label: 'Interior Decoration Items' },
    { value: 'furniture', label: 'Furniture & Built-ins' },
    { value: 'lighting', label: 'Interior Lighting & LEDs' },
    { value: 'wall_cladding', label: 'Wall Cladding & Stones' },
    { value: 'other', label: 'Other Finishing Materials' },
  ],

  // -----------------------------------
  // SAFETY PRODUCTS
  // -----------------------------------
  safety: [
    { value: 'ppe', label: 'Safety PPE (Helmets, Vests, Boots)' },
    { value: 'warning', label: 'Warning Tape & Signage' },
    { value: 'fire', label: 'Fire Safety Equipment' },
    { value: 'barricade', label: 'Barricades & Railings' },
    { value: 'first_aid', label: 'First Aid Kits' },
    { value: 'other', label: 'Other Safety Products' }
  ],

  // -----------------------------------
  // HEAVY MACHINERY CATEGORY
  // -----------------------------------
  machinery: [
    { value: 'bulldozer', label: 'Bulldozers' },
    { value: 'grader', label: 'Motor Graders' },
    { value: 'roller', label: 'Rollers' },
    { value: 'mixers', label: 'Concrete Mixers' },
    { value: 'dumptruck', label: 'Dump Trucks' },
    { value: 'other', label: 'Other Machinery' }
  ],

  // -----------------------------------
  // CATCH-ALL
  // -----------------------------------
  other: [
    { value: 'misc', label: 'Miscellaneous Products' }
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
    { value: 'm3', label: 'Cubic Meters (m³)' },
    { value: 'sqm', label: 'Square Meters' },
    { value: 'biago', label: 'Biago' },
    { value: 'hr', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'month', label: 'Per Month' },
    { value: 'job', label: 'Per Job' },
    { value: 'trip', label: 'Per Trip' },
];

export const getUnitDisplay = (unit: string): string => {
  const unitMap: Record<string, string> = {
    'pcs': 'piece',
    'kg': 'kg',
    'bag': 'bag',
    'ton': 'ton',
    'm': 'm',
    'm3': 'm³',
    'sqm': 'm²',
    'biago': 'biago',
    'hr': 'hour',
    'day': 'day',
    'month': 'month',
    'job': 'job',
    'trip': 'trip',
  };
  return unitMap[unit] || unit;
};

// Keep these for backward compatibility during migration
export const PRODUCT_CATEGORIES = SUB_CATEGORIES.materials;
export const SERVICE_CATEGORIES = SUB_CATEGORIES.services;
