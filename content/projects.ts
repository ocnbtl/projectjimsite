export type Project = {
  number: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  orientation?: "landscape" | "portrait";
};

export const projects: Project[] = [
  {
    number: "01",
    slug: "addition-color-integration",
    title: "Addition color integration",
    category: "Exterior brick · large-scale matching",
    summary:
      "A newly built section read cooler and more uniform than the surrounding home. The finished color relationship brings the addition into the warmer red character of the original elevations.",
    before: "/images/projects/addition-before.jpeg",
    after: "/images/projects/addition-after.jpeg",
    beforeAlt:
      "Before color correction, a large brick addition appears cooler and grayer than the adjacent red brick home.",
    afterAlt:
      "After color correction, the large brick addition relates to the warmer red brick on the rest of the home.",
  },
  {
    number: "02",
    slug: "localized-repair-blending",
    title: "Localized repair blending",
    category: "Exterior brick · selective correction",
    summary:
      "A conspicuous light-orange repair interrupted a dark, varied brick wall. Selective color work reduced the contrast so the repaired area sits more naturally within the existing masonry.",
    before: "/images/projects/repair-before.jpeg",
    after: "/images/projects/repair-after.jpeg",
    beforeAlt:
      "Before color correction, a pale orange rectangular brick repair stands out beside darker existing brick.",
    afterAlt:
      "After color correction, the repaired brick area is blended into the darker varied brick wall around it.",
  },
  {
    number: "03",
    slug: "fireplace-wood-tone-matching",
    title: "Fireplace wood-tone matching",
    category: "Interior finish · wood-tone correction",
    summary:
      "The stone was left unchanged. MCC adjusted the lighter mantel tone to relate more closely to the existing darker wood trim.",
    before: "/images/projects/fireplace-before.jpeg",
    after: "/images/projects/fireplace-after.jpeg",
    beforeAlt:
      "Before color correction, the fireplace mantel appears lighter than the existing darker wood trim.",
    afterAlt:
      "After color correction, the fireplace mantel has a deeper brown tone that coordinates with the existing wood trim while the stone remains unchanged.",
    orientation: "portrait",
  },
  {
    number: "04",
    slug: "whole-wall-color-correction",
    title: "Whole-wall color correction",
    category: "Exterior brick · broad-surface correction",
    summary:
      "The long exterior wall needed a more cohesive relationship between its red field brick and dark accents. The completed surface feels brighter and more integrated while preserving brick-by-brick variation.",
    before: "/images/projects/wall-before.jpeg",
    after: "/images/projects/wall-after.jpeg",
    beforeAlt:
      "Before broad-surface color correction, a long exterior brick wall has muted red tones and scattered dark bricks.",
    afterAlt:
      "After broad-surface color correction, the long exterior wall has a brighter, more cohesive red brick appearance with varied dark accents.",
  },
  {
    number: "05",
    slug: "entry-wall-repair-matching",
    title: "Entry-wall repair matching",
    category: "Exterior brick · repair integration",
    summary:
      "A repaired area beside the entry needed to agree with the surrounding facade. The finished wall restores continuity across the brick field while leaving the masonry’s natural tonal movement visible.",
    before: "/images/projects/entry-before.jpeg",
    after: "/images/projects/entry-after.jpeg",
    beforeAlt:
      "Before final color matching, equipment and protection are set up in front of a repaired red brick entry wall.",
    afterAlt:
      "After color matching, the clean red brick entry wall reads as a continuous facade around the dark door.",
  },
];

export const featuredProject = projects[0];
export const educationProject = projects[1];
