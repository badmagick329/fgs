export type MarketingSectionId =
  | 'about'
  | 'ceo-message'
  | 'why-fgs'
  | 'join'
  | 'gallery'
  | 'contact';

export type MarketingNavItem = {
  id: MarketingSectionId;
  label: string;
};

export type MarketingParagraphBlock = {
  title?: string;
  paragraphs: string[];
};
