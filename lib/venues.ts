export const INSTITUTIONAL_VENUES = [
    { value: "AVIC LAB", label: "AVIC Lab" },
    { value: "ARAD LAB", label: "ARAD Lab" },
    { value: "MAIN OCTAGON", label: "Main Octagon" },
    { value: "FAD LAB", label: "FAD Lab" },
    { value: "BASEMENT", label: "Basement" },
    { value: "DIGITAL LAB", label: "Digital Lab" },
    { value: "OCTAGON WING", label: "Octagon Wing" },
    { value: "V BLOCK", label: "V Block" },
] as const;

export type VenueCode = typeof INSTITUTIONAL_VENUES[number]["value"];
export type VenueLabel = typeof INSTITUTIONAL_VENUES[number]["label"];

export const VENUE_LABELS = INSTITUTIONAL_VENUES.map(v => v.label);
