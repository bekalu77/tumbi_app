import React from 'react';
import { Category } from './types';
import { HammerIcon, HomeIcon, ServicesIcon, MaterialsIcon, RentalIcon, WrenchIcon, TruckIcon } from './components/Icons';

export const CATEGORIES_DATA: Record<string, { en: string, am: string, icon: any }> = {
  all: { en: 'All Categories', am: 'ሁሉም ክፍሎች', icon: <HomeIcon className="w-5 h-5" /> },
  materials: { en: 'Construction Materials', am: 'የግንባታ ዕቃዎች', icon: <MaterialsIcon className="w-5 h-5" /> },
  mep: { en: 'MEP Supplies', am: 'የኤሌክትሪክና ቧንቧ ዕቃዎች', icon: <WrenchIcon className="w-5 h-5" /> },
  finishing: { en: 'Finishing & Interior', am: 'የፊኒሺንግ እና የውስጥ ማስጌጫ', icon: <HammerIcon className="w-5 h-5" /> },
  services: { en: 'Skilled Services', am: 'የባለሙያ አገልግሎቶች', icon: <ServicesIcon className="w-5 h-5" /> },
  rentals: { en: 'Equipment & Tool Rental', am: 'የመሳሪያዎች ኪራይ', icon: <TruckIcon className="w-5 h-5" /> },
  safety: { en: 'Site Safety & Accessories', am: 'የደህንነት መጠበቂያዎች', icon: <TruckIcon className="w-5 h-5" /> },
  machinery: { en: 'Heavy Machinery & Vehicles', am: 'ከባድ ማሽነሪዎች', icon: <TruckIcon className="w-5 h-5" /> },
  other: { en: 'Other & Miscellaneous', am: 'ሌሎች', icon: <HomeIcon className="w-5 h-5" /> },
};

export const getCategories = (lang: 'en' | 'am'): Category[] => {
  return Object.entries(CATEGORIES_DATA).map(([slug, data], index) => ({
    id: String(index + 1),
    name: lang === 'am' ? data.am : data.en,
    slug: slug,
    icon: data.icon
  }));
};

export const SUB_CATEGORIES_DATA: Record<string, { value: string, en: string, am: string }[]> = {
  materials: [
    { value: 'cement', en: 'Cement & Concrete', am: 'ሲሚንቶ እና ኮንክሪት' },
    { value: 'steel_rebar', en: 'Steel & Rebar', am: 'ብረት እና ብረት ብረት' },
    { value: 'masonry', en: 'Bricks, HCB & Blocks', am: 'ጡብ እና ብሎኬት' },
    { value: 'sand_agg', en: 'Sand & Aggregates', am: 'አሸዋ እና ጠጠር' },
    { value: 'asphalt', en: 'Asphalt & Road Base', am: 'አስፋልት' },
    { value: 'roofing', en: 'Roofing Sheets & Tiles', am: 'ቆርቆሮ እና ክዳን' },
    { value: 'wood', en: 'Timber & Formwork Materials', am: 'እንጨት' },
    { value: 'waterproofing', en: 'Waterproofing Membrane & Sealants', am: 'የውሃ መከላከያ' },
    { value: 'chemicals', en: 'Construction Chemicals & Admixtures', am: 'ኬሚካሎች' },
    { value: 'glass', en: 'Glass & Glazing', am: 'ብርጭቆ' },
    { value: 'foundation', en: 'Foundation Reinforcement Materials', am: 'የመሰረት ማጠናከሪያ' },
    { value: 'geotextile', en: 'Geotextiles & Geo-membranes', am: 'ጂኦቴክስታይል' },
    { value: 'other', en: 'Other Construction Materials', am: 'ሌሎች ግንባታ ዕቃዎች' },
  ],
  mep: [
    { value: 'pvc_pipes', en: 'PVC Pipes & Fittings', am: 'ፒቪሲ ቧንቧዎች' },
    { value: 'hdpe', en: 'HDPE Pipes & Fittings', am: 'ኤችዲፒኢ ቧንቧዎች' },
    { value: 'water_tanks', en: 'Water Tanks', am: 'የውሃ ታንከሮች' },
    { value: 'pumps', en: 'Water Pumps', am: 'የውሃ ፓምፖች' },
    { value: 'electrical_cables', en: 'Cables & Electrical Wiring', am: 'የኤሌክትሪክ ገመዶች' },
    { value: 'lighting_elec', en: 'Electrical Lighting Fixtures', am: 'መብራቶች' },
    { value: 'switches', en: 'Switches, Sockets & DB Boards', am: 'ስዊቾችና ሶኬቶች' },
    { value: 'generators', en: 'Generators & Backup Power', am: 'ጄኔሬተሮች' },
    { value: 'hvac', en: 'HVAC & AC Parts', am: 'ኤርኮንዲሽነር' },
    { value: 'ducting', en: 'Ducting Materials', am: 'ደክቲንግ' },
    { value: 'valves', en: 'Industrial Valves & Fittings', am: 'ቫልቮች' },
    { value: 'other', en: 'Other MEP Items', am: 'ሌሎች' }
  ],
  services: [
    { value: 'architects', en: 'Architecture & Design', am: 'አርክቴክቸር እና ዲዛይን' },
    { value: 'structural', en: 'Structural Engineering', am: 'ስትራክቸራል ኢንጂነሪንግ' },
    { value: 'land_survey', en: 'Land Surveying', am: 'የመሬት ልኬት' },
    { value: 'construction_services', en: 'General Construction Works', am: 'አጠቃላይ ግንባታ' },
    { value: 'masonry', en: 'Masonry Work', am: 'የግንብ ስራ' },
    { value: 'rebar_bending', en: 'Rebar Bending', am: 'የብረት ስራ' },
    { value: 'installation_professionals', en: 'Installation Professionals', am: 'የገጠማ ባለሙያዎች' },
    { value: 'plumbing_service', en: 'Plumbing Installation', am: 'የቧንቧ ስራ' },
    { value: 'electrical_service', en: 'Electrical Installation', am: 'የኤሌክትሪክ ስራ' },
    { value: 'painting_service', en: 'Painting & Gypsum', am: 'ቀለም እና ጂፕሰም' },
    { value: 'tile_install', en: 'Tile & Flooring Work', am: 'የሴራሚክ ስራ' },
    { value: 'carpentry', en: 'Carpentry & Joinery', am: 'የአናጺነት ስራ' },
    { value: 'metalwork', en: 'Metal Work & Welding', am: 'የብረታብረት ስራ' },
    { value: 'interior_design', en: 'Interior Design & Furniture', am: 'የውስጥ ማስጌጥ' },
    { value: 'landscaping', en: 'Landscaping & Gardening', am: 'የአትክልት ስራ' },
    { value: 'other', en: 'Other Services', am: 'ሌሎች አገልግሎቶች' },
  ],
  rentals: [
    { value: 'excavators', en: 'Excavators & Loaders', am: 'ኤክስካቫተር እና ሎደር' },
    { value: 'cranes', en: 'Cranes & Hoists', am: 'ክሬኖች' },
    { value: 'mixers', en: 'Concrete Mixers', am: 'ኮንክሪት ሚክሰር' },
    { value: 'compact', en: 'Compaction Tools', am: 'ኮምፓክሽን' },
    { value: 'power_tools', en: 'Hand & Power Tools', am: 'የእጅ መሳርያዎች' },
    { value: 'transport', en: 'Transport Trucks', am: 'የትራንስፖርት መኪናዎች' },
    { value: 'scaffolding', en: 'Scaffolding & Props', am: 'ስካፎልዲንግ' },
    { value: 'other', en: 'Other Rental Equipment', am: 'ሌሎች ኪራዮች' },
  ],
  finishing: [
    { value: 'tiles', en: 'Tiles & Flooring', am: 'ሴራሚክ እና የወለል ንጣፍ' },
    { value: 'paint', en: 'Paints & Coatings', am: 'ቀለሞች' },
    { value: 'gypsum_board', en: 'Gypsum Board & Ceilings', am: 'ጂፕሰም' },
    { value: 'sanitary', en: 'Sanitary Ware', am: 'የንፅህና መጠበቂያ ዕቃዎች' },
    { value: 'kitchen', en: 'Kitchen Cabinets & Accessories', am: 'የወጥ ቤት ዕቃዎች' },
    { value: 'doors', en: 'Doors & Windows', am: 'በሮች እና መስኮቶች' },
    { value: 'decor', en: 'Interior Decoration Items', am: 'የውስጥ ማስጌጫዎች' },
    { value: 'furniture', en: 'Furniture & Built-ins', am: 'ፈርኒቸር' },
    { value: 'lighting', en: 'Interior Lighting & LEDs', am: 'የውስጥ መብራቶች' },
    { value: 'wall_cladding', en: 'Wall Cladding & Stones', am: 'የግድግዳ ማስጌጫ' },
    { value: 'other', en: 'Other Finishing Materials', am: 'ሌሎች' },
  ],
  safety: [
    { value: 'ppe', en: 'Safety PPE (Helmets, Vests, Boots)', am: 'የደህንነት አልባሳት' },
    { value: 'warning', en: 'Warning Tape & Signage', am: 'የማስጠንቀቂያ ምልክቶች' },
    { value: 'fire', en: 'Fire Safety Equipment', am: 'የእሳት አደጋ መከላከያ' },
    { value: 'barricade', en: 'Barricades & Railings', am: 'መከለያዎች' },
    { value: 'first_aid', en: 'First Aid Kits', am: 'የመጀመሪያ እርዳታ' },
    { value: 'other', en: 'Other Safety Products', am: 'ሌሎች' }
  ],
  machinery: [
    { value: 'bulldozer', en: 'Bulldozers', am: 'ቡልዶዘር' },
    { value: 'grader', en: 'Motor Graders', am: 'ግሬደር' },
    { value: 'roller', en: 'Rollers', am: 'ሮለር' },
    { value: 'mixers', en: 'Concrete Mixers', am: 'ሚክሰር' },
    { value: 'dumptruck', en: 'Dump Trucks', am: 'ዲምፐር መኪና' },
    { value: 'other', en: 'Other Machinery', am: 'ሌሎች ማሽነሪዎች' }
  ],
  other: [
    { value: 'misc', en: 'Miscellaneous Products', am: 'የተለያዩ ዕቃዎች' }
  ]
};

export const getSubCategories = (lang: 'en' | 'am', mainCategory: string) => {
  if (!SUB_CATEGORIES_DATA[mainCategory]) return [];
  return SUB_CATEGORIES_DATA[mainCategory].map(sub => ({
    value: sub.value,
    label: lang === 'am' ? sub.am : sub.en
  }));
};

export const ETHIOPIAN_CITIES_DATA = [
  { en: 'Addis Ababa', am: 'አዲስ አበባ' },
  { en: 'Adama', am: 'አዳማ' },
  { en: 'Bahir Dar', am: 'ባህር ዳር' },
  { en: 'Bishoftu', am: 'ቢሾፍቱ' },
  { en: 'Debre Berhan', am: 'ደብረ ብርሃን' },
  { en: 'Dessie', am: 'ደሴ' },
  { en: 'Dire Dawa', am: 'ድሬ ዳዋ' },
  { en: 'Gondar', am: 'ጎንደር' },
  { en: 'Hawassa', am: 'ሀዋሳ' },
  { en: 'Jimma', am: 'ጅማ' },
  { en: 'Mekelle', am: 'መቀሌ' },
  { en: 'Shashamane', am: 'ሻሸመኔ' },
  { en: 'Sodo', am: 'ሶዶ' },
  { en: 'Arba Minch', am: 'አርባ ምንጭ' },
  { en: 'Hosaena', am: 'ሆሳዕና' },
  { en: 'Jijiga', am: 'ጅጅጋ' },
  { en: 'Asosa', am: 'አሶሳ' },
  { en: 'Gambela', am: 'ጋምቤላ' },
  { en: 'Semera', am: 'ሰመራ' }
];

export const getCities = (lang: 'en' | 'am') => {
  return ETHIOPIAN_CITIES_DATA.map(city => lang === 'am' ? city.am : city.en);
};

export const MEASUREMENT_UNITS_DATA = [
    { value: 'pcs', en: 'Pieces (pcs)', am: 'ፍሬ' },
    { value: 'kg', en: 'Kilograms (kg)', am: 'ኪሎግራም' },
    { value: 'bag', en: 'Bags', am: 'ጆንያ/ቦርሳ' },
    { value: 'ton', en: 'Tons', am: 'ቶን' },
    { value: 'm', en: 'Meters', am: 'ሜትር' },
    { value: 'm3', en: 'Cubic Meters (m³)', am: 'ኩቢክ ሜትር' },
    { value: 'sqm', en: 'Square Meters', am: 'ካሬ ሜትር' },
    { value: 'biago', en: 'Biago', am: 'ቢያጎ' },
    { value: 'hr', en: 'Hour', am: 'በሰዓት' },
    { value: 'day', en: 'Day', am: 'በቀን' },
    { value: 'month', en: 'Per Month', am: 'በወር' },
    { value: 'job', en: 'Per Job', am: 'በስራ' },
    { value: 'trip', en: 'Per Trip', am: 'በጉዞ' },
];

export const getMeasurementUnits = (lang: 'en' | 'am') => {
  return MEASUREMENT_UNITS_DATA.map(u => ({
    value: u.value,
    label: lang === 'am' ? u.am : u.en
  }));
};

export const getUnitDisplay = (unit: string, lang: 'en' | 'am'): string => {
  const found = MEASUREMENT_UNITS_DATA.find(u => u.value === unit);
  if (!found) return unit;
  return lang === 'am' ? found.am : found.en;
};

// Legacy exports for compatibility (will need to be updated in components)
export const CATEGORIES = getCategories('en');
export const SUB_CATEGORIES: any = {}; 
Object.keys(SUB_CATEGORIES_DATA).forEach(k => {
  SUB_CATEGORIES[k] = getSubCategories('en', k);
});
export const ETHIOPIAN_CITIES = getCities('en');
export const MEASUREMENT_UNITS = getMeasurementUnits('en');
