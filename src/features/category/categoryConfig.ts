export type SubCategory = { label: string; slug: string };

export type CategoryConfig = {
  slug: string;
  label: string;
  subcategories: SubCategory[];
};

export const CATEGORIES: CategoryConfig[] = [
  {
    slug: "kitchen",
    label: "Kitchen Appliances",
    subcategories: [
      { label: "Rice Cookers", slug: "rice-cookers" },
      { label: "Microwave Ovens", slug: "microwave-ovens" },
      { label: "Air Fryers", slug: "air-fryers" },
      { label: "Coffee Makers", slug: "coffee-makers" },
      { label: "Blenders", slug: "blenders" },
      { label: "Refrigerators", slug: "refrigerators" },
      { label: "Induction Cookers", slug: "induction-cookers" },
    ],
  },
  {
    slug: "cleaning",
    label: "Cleaning Appliances",
    subcategories: [
      { label: "Vacuum Cleaners", slug: "vacuum-cleaners" },
      { label: "Washing Machines", slug: "washing-machines" },
      { label: "Dishwashers", slug: "dishwashers" },
      { label: "Air Purifiers", slug: "air-purifiers" },
      { label: "Shavers", slug: "shavers" },
      { label: "Hair Dryers", slug: "hair-dryers" },
      { label: "Hair Straighteners", slug: "hair-straighteners" },
    ],
  },
  {
    slug: "cooling",
    label: "Cooling and Heating",
    subcategories: [
      { label: "Electric Fans", slug: "electric-fans" },
      { label: "Air Conditioners", slug: "air-conditioners" },
    ],
  },
  {
    slug: "entertainment",
    label: "Entertainment",
    subcategories: [
      { label: "Audio", slug: "audio" },
      { label: "Visuals", slug: "visuals" },
      { label: "Gaming", slug: "gaming" },
    ],
  },
  {
    slug: "personal",
    label: "Personal Care",
    subcategories: [],
  },
  {
    slug: "household",
    label: "Small Household",
    subcategories: [],
  },
  {
    slug: "office",
    label: "Office Appliances",
    subcategories: [],
  },
  {
    slug: "home",
    label: "Home Appliances",
    subcategories: [],
  },
];
