export type GazettePartner = {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  sortOrder: number;
};

export const GAZETTE_PARTNERS: GazettePartner[] = [
  {
    id: "gazette-cosea",
    name: "Cosea",
    description: "Partenaire du CS Viriat.",
    logoUrl: "/partenaires/logos/cosea.png",
    websiteUrl: null,
    sortOrder: 10,
  },
  {
    id: "gazette-daniel-moquet",
    name: "Daniel Moquet",
    description: "Partenaire du CS Viriat.",
    logoUrl: "/partenaires/logos/daniel-moquet.png",
    websiteUrl: null,
    sortOrder: 20,
  },
  {
    id: "gazette-maison-des-viandes",
    name: "Maison des viandes",
    description: "Partenaire du CS Viriat.",
    logoUrl: "/partenaires/logos/maison-des-viandes.png",
    websiteUrl: null,
    sortOrder: 30,
  },
  {
    id: "gazette-mobel-design-agencement",
    name: "Mobel Design agencement",
    description: "Partenaire du CS Viriat.",
    logoUrl: "/partenaires/logos/mobel-design-agencement.png",
    websiteUrl: null,
    sortOrder: 40,
  },
  {
    id: "gazette-orchestra",
    name: "Orchestra",
    description: "Partenaire du CS Viriat.",
    logoUrl: "/partenaires/logos/orchestra.png",
    websiteUrl: null,
    sortOrder: 60,
  },
  {
    id: "gazette-so-club",
    name: "So Club",
    description: "Partenaire du CS Viriat.",
    logoUrl: "/partenaires/logos/so-club.png",
    websiteUrl: null,
    sortOrder: 70,
  },
  {
    id: "gazette-x-trem",
    name: "X Trem",
    description: "Partenaire du CS Viriat.",
    logoUrl: "/partenaires/logos/x-trem.png",
    websiteUrl: null,
    sortOrder: 80,
  },
  {
    id: "gazette-bain-de-soleil-piscine-et-spa",
    name: "Bain de soleil piscine et spa",
    description: "Partenaire du CS Viriat.",
    logoUrl: "/partenaires/logos/bain-de-soleil-piscine-et-spa.png",
    websiteUrl: null,
    sortOrder: 90,
  },
  {
    id: "gazette-adidom",
    name: "Adidom",
    description: "Partenaire du CS Viriat.",
    logoUrl: "/partenaires/logos/adidom.png",
    websiteUrl: null,
    sortOrder: 100,
  },
];
