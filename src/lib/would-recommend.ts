export const WOULD_RECOMMEND_VALUES = ["yes", "no", "maybe"] as const;

export type WouldRecommend = (typeof WOULD_RECOMMEND_VALUES)[number];

export const WOULD_RECOMMEND_LABEL: Record<WouldRecommend, string> = {
  yes: "Yes",
  no: "No",
  maybe: "Maybe",
};

export const WOULD_RECOMMEND_BADGE_LABEL: Record<WouldRecommend, string> = {
  yes: "Would recommend",
  no: "Would not recommend",
  maybe: "Maybe recommend",
};
