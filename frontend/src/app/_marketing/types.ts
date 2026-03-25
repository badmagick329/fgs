import type { SectionId } from '@/app/_components/NavBar';

export type MarketingNavItem = {
  id: SectionId;
  label: string;
};

export type MarketingParagraphBlock = {
  title?: string;
  paragraphs: string[];
};
