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
      "A newer brick section looked noticeably grayer and more uniform beside the home’s original red masonry. The finished color relationship brings the addition into the warmer character of the surrounding elevations.",
    before: "/images/projects/aligned/addition-before.webp",
    after: "/images/projects/aligned/addition-after.webp",
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
      "After a car drove through the wall, the rebuilt section left a light-orange repair against the home’s darker, varied brick. MCC matched the repaired masonry so the new work sits naturally within the original wall.",
    before: "/images/projects/aligned/repair-before.webp",
    after: "/images/projects/aligned/repair-after.webp",
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
      "The newly installed mantel was noticeably lighter than the darker wood trim already running through the room. MCC adjusted the wood tone so those finishes felt connected, while leaving the fireplace stone unchanged.",
    before: "/images/projects/aligned/fireplace-before.webp",
    after: "/images/projects/aligned/fireplace-after.webp",
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
    before: "/images/projects/aligned/wall-before.webp",
    after: "/images/projects/aligned/wall-after.webp",
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
      "A repaired section beside the entry stood out from the brick around it. MCC adjusted the repaired area until it blended with the rest of the wall while keeping the natural variation between individual bricks.",
    before: "/images/projects/aligned/entry-before.webp",
    after: "/images/projects/aligned/entry-after.webp",
    beforeAlt:
      "Before final color matching, equipment and protection are set up in front of a repaired red brick entry wall.",
    afterAlt:
      "After color matching, the clean red brick entry wall reads as a continuous facade around the dark door.",
  },
];

export const featuredProject = projects[0];
export const educationProject = projects[1];
