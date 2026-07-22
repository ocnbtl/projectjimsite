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
  story: {
    situation: string;
    colorWork: string;
    result: string;
  };
  orientation?: "landscape" | "portrait";
};

export const projects: Project[] = [
  {
    number: "01",
    slug: "addition-color-integration",
    title: "Addition color integration",
    category: "House addition · coordinated brick matching",
    summary:
      "A new addition began with gray brick that stood apart from the home’s original red masonry. MCC coordinated with the builder, then color-matched the new work after construction was complete.",
    before: "/images/projects/aligned/addition-before.webp",
    after: "/images/projects/aligned/addition-after.webp",
    beforeAlt:
      "Before color correction, a large brick addition appears cooler and grayer than the adjacent red brick home.",
    afterAlt:
      "After color correction, the large brick addition relates to the warmer red brick on the rest of the home.",
    story: {
      situation:
        "The original home was not one flat red. Its walls included lighter and darker bricks that created a natural pattern, while the newly built addition began as a much grayer field.",
      colorWork:
        "MCC worked with the builder before the color stage. The mason placed selected lighter and darker bricks through the addition so MCC had the variation needed to recreate the character of the original walls. Once the masonry work was finished, MCC mixed and applied the red color family across the new brick.",
      result:
        "The addition keeps visible brick-to-brick variation while relating much more closely to the warmer masonry on the existing home.",
    },
  },
  {
    number: "02",
    slug: "localized-repair-blending",
    title: "Post-repair brick matching",
    category: "Car-impact repair · selective brick staining",
    summary:
      "A car crashed through this exterior wall. A mason rebuilt the damaged area, then MCC was brought in to color-match the lighter replacement brick to the original wall.",
    before: "/images/projects/aligned/repair-before.webp",
    after: "/images/projects/aligned/repair-after.webp",
    beforeAlt:
      "Before color correction, a pale orange rectangular brick repair stands out beside darker existing brick.",
    afterAlt:
      "After color correction, the repaired brick area is blended into the darker varied brick wall around it.",
    story: {
      situation:
        "The collision damaged the wall and required masonry reconstruction. The replacement brick was structurally sound, but its light orange color made the repaired rectangle easy to see.",
      colorWork:
        "After the mason completed the rebuild, MCC studied the surrounding dark reds, browns, and scattered accents. Those colors were mixed and applied selectively to the new brick rather than rebuilding the wall again.",
      result:
        "The repaired section now sits inside the original wall’s darker variation instead of reading as one separate block of new masonry.",
    },
  },
  {
    number: "03",
    slug: "ceramic-mantel-color-matching",
    title: "Ceramic mantel color matching",
    category: "Interior finish · multi-material matching",
    summary:
      "MCC worked with the manufacturer on a ceramic mantel molded to resemble the room’s original woodwork, then colored the new piece to relate to the real wood beams around it.",
    before: "/images/projects/aligned/fireplace-before.webp",
    after: "/images/projects/aligned/fireplace-after.webp",
    beforeAlt:
      "Before color matching, the ceramic fireplace mantel appears lighter than the existing darker wood beams.",
    afterAlt:
      "After color matching, the ceramic fireplace mantel has a deeper brown finish that coordinates with the existing wood beams while the stone remains unchanged.",
    story: {
      situation:
        "MCC worked with the factory to produce a ceramic mantel molded from an accurate wood replica. The new piece captured the shape and grain of wood, but its pale factory finish still stood apart from the darker beams already defining the room.",
      colorWork:
        "Using the original beams as the visual reference, MCC mixed, dyed, and layered color across the ceramic surface so the molded grain carried a convincing wood tone. The fireplace stone was left unchanged.",
      result:
        "The non-wood mantel now carries a wood-like tone that connects it to the room’s original beams and demonstrates MCC’s ability to solve select color problems beyond brick.",
    },
    orientation: "portrait",
  },
  {
    number: "04",
    slug: "paint-chalking-color-correction",
    title: "Paint-chalking color correction",
    category: "Exterior brick · aluminum-siding chalk run-down",
    summary:
      "Weathered paint on the aluminum siding above this wall released chalky pigment that washed down onto the brick. MCC neutralized the unwanted cast with stain so the masonry returned closer to its original appearance.",
    before: "/images/projects/aligned/wall-before.webp",
    after: "/images/projects/aligned/wall-after.webp",
    beforeAlt:
      "Before color correction, chalk run-down from painted aluminum siding leaves a muted cast across a long exterior brick wall.",
    afterAlt:
      "After color correction, the long exterior brick wall has a clearer red appearance while retaining its scattered dark accents.",
    story: {
      situation:
        "As the painted aluminum siding weathered, fine chalky pigment traveled downward during rain and discolored the brick below. This kind of coating erosion is commonly called paint chalking or chalk run-down.",
      colorWork:
        "Instead of treating the wall as a new construction project, MCC worked with stain colors that visually canceled the unwanted siding pigment across the affected brick faces.",
      result:
        "The brick reads closer to its original red field again, and the naturally darker accent bricks remain visible rather than being hidden beneath one uniform color.",
    },
  },
  {
    number: "05",
    slug: "two-batch-brick-matching",
    title: "Two-batch brick and mortar matching",
    category: "Exterior brick · shipment and mortar variation",
    summary:
      "Two separate brick shipments were used on this entry wall, and the batches did not match. MCC adjusted the brick and mortar color so the separate sections read as one facade.",
    before: "/images/projects/aligned/entry-before.webp",
    after: "/images/projects/aligned/entry-after.webp",
    beforeAlt:
      "Before final color matching, two areas of brick and mortar around an entry show noticeable batch differences while the work area is protected.",
    afterAlt:
      "After brick and mortar color matching, the red entry wall reads as a more continuous facade around the dark door.",
    story: {
      situation:
        "Part of the wall was built from one brick shipment and the remaining area from another. Differences between the batches—and in the surrounding mortar—made the transition noticeable.",
      colorWork:
        "MCC developed matching tones for both the brick faces and the mortar joints, refining the visible shift between the two deliveries without replacing the installed masonry.",
      result:
        "The entry reads as one connected wall, with enough natural variation left in place that the finished surface still looks like brick rather than a flat coating.",
    },
  },
];

export const featuredProject = projects[0];
export const educationProject = projects[1];
