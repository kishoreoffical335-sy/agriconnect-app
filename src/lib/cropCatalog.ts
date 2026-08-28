export type CropCategory = 'vegetables' | 'rice' | 'wheat' | 'grains' | 'spices';

export interface CropCatalogItem {
  id: string;
  name: string;
  category: CropCategory;
  unit: 'kg' | 'quintal' | 'tonne';
  typicalUnit: string;
  aliases: string[];
}

export const CROP_CATALOG: CropCatalogItem[] = [
  { id: 'tomato', name: 'Tomato', category: 'vegetables', unit: 'kg', typicalUnit: 'kg', aliases: ['thakkali', 'tamatar'] },
  { id: 'onion', name: 'Onion', category: 'vegetables', unit: 'kg', typicalUnit: 'kg', aliases: ['vengayam', 'pyaz'] },
  { id: 'potato', name: 'Potato', category: 'vegetables', unit: 'kg', typicalUnit: 'kg', aliases: ['urulaikizhangu', 'aloo'] },
  { id: 'brinjal', name: 'Brinjal', category: 'vegetables', unit: 'kg', typicalUnit: 'kg', aliases: ['kathirikkai', 'baingan'] },
  { id: 'okra', name: 'Okra', category: 'vegetables', unit: 'kg', typicalUnit: 'kg', aliases: ['vendakkai', 'bhindi'] },
  { id: 'cabbage', name: 'Cabbage', category: 'vegetables', unit: 'kg', typicalUnit: 'kg', aliases: ['muttai kosu', 'patta gobhi'] },
  { id: 'cauliflower', name: 'Cauliflower', category: 'vegetables', unit: 'kg', typicalUnit: 'kg', aliases: ['cauliflower', 'phool gobhi'] },
  { id: 'carrot', name: 'Carrot', category: 'vegetables', unit: 'kg', typicalUnit: 'kg', aliases: ['carrot', 'gajar'] },
  { id: 'beans', name: 'Beans', category: 'vegetables', unit: 'kg', typicalUnit: 'kg', aliases: ['beans', 'sem'] },
  { id: 'green-chilli', name: 'Green Chilli', category: 'vegetables', unit: 'kg', typicalUnit: 'kg', aliases: ['pachai milagai', 'hari mirch'] },
  { id: 'rice', name: 'Rice / Paddy', category: 'rice', unit: 'kg', typicalUnit: 'kg', aliases: ['nel', 'chawal', 'dhan'] },
  { id: 'wheat', name: 'Wheat', category: 'wheat', unit: 'kg', typicalUnit: 'kg', aliases: ['godhumai', 'gehun'] },
  { id: 'maize', name: 'Maize', category: 'grains', unit: 'kg', typicalUnit: 'kg', aliases: ['cholam', 'makka'] },
  { id: 'ragi', name: 'Ragi', category: 'grains', unit: 'kg', typicalUnit: 'kg', aliases: ['kezhvaragu', 'nachni'] },
  { id: 'millet', name: 'Pearl Millet', category: 'grains', unit: 'kg', typicalUnit: 'kg', aliases: ['kambu', 'bajra'] },
  { id: 'tur-dal', name: 'Tur / Pigeon Pea', category: 'grains', unit: 'kg', typicalUnit: 'kg', aliases: ['thuvaram paruppu', 'arhar'] },
  { id: 'chickpea', name: 'Chickpea', category: 'grains', unit: 'kg', typicalUnit: 'kg', aliases: ['kondakadalai', 'chana'] },
  { id: 'black-pepper', name: 'Black Pepper', category: 'spices', unit: 'kg', typicalUnit: 'kg', aliases: ['milagu', 'kali mirch'] },
  { id: 'turmeric', name: 'Turmeric', category: 'spices', unit: 'kg', typicalUnit: 'kg', aliases: ['manjal', 'haldi'] },
  { id: 'cumin', name: 'Cumin', category: 'spices', unit: 'kg', typicalUnit: 'kg', aliases: ['seeragam', 'jeera'] },
  { id: 'coriander', name: 'Coriander Seed', category: 'spices', unit: 'kg', typicalUnit: 'kg', aliases: ['malli', 'dhania'] },
  { id: 'cardamom', name: 'Cardamom', category: 'spices', unit: 'kg', typicalUnit: 'kg', aliases: ['elakkai', 'elaichi'] },
  { id: 'clove', name: 'Clove', category: 'spices', unit: 'kg', typicalUnit: 'kg', aliases: ['lavangam', 'laung'] },
  { id: 'dry-chilli', name: 'Dry Chilli', category: 'spices', unit: 'kg', typicalUnit: 'kg', aliases: ['milagai', 'sukhi mirch'] },
];

export const CROP_CATEGORIES: { id: CropCategory; label: string }[] = [
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'rice', label: 'Rice & Paddy' },
  { id: 'wheat', label: 'Wheat' },
  { id: 'grains', label: 'Grains & Millets' },
  { id: 'spices', label: 'Spices' },
];
