export type MarketingSectionId =
  | 'about'
  | 'ceo-message'
  | 'why-fgs'
  | 'join'
  | 'gallery'
  | 'registration'
  | 'contact';

export type MarketingNavItem = {
  id: MarketingSectionId;
  label: string;
};

export type MarketingParagraphBlock = {
  title?: string;
  paragraphs: string[];
};
