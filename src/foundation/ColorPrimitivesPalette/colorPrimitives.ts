export type ColorPrimitiveFamily = {
  id: string;
  label: string;
  shades: string[];
};

export const COLOR_PRIMITIVE_FAMILIES: ColorPrimitiveFamily[] = [
  {
    id: "blue",
    label: "Blue",
    shades: [
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
      "950",
    ],
  },
  {
    id: "grey",
    label: "Grey",
    shades: [
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
      "950",
    ],
  },
  {
    id: "red",
    label: "Red",
    shades: [
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
      "950",
    ],
  },
  {
    id: "green",
    label: "Green",
    shades: [
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
      "950",
    ],
  },
  {
    id: "slate",
    label: "Slate",
    shades: [
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
      "950",
    ],
  },
  {
    id: "orange",
    label: "Orange",
    shades: [
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
      "950",
    ],
  },
  {
    id: "foundations",
    label: "Foundations",
    shades: ["white", "black"],
  },
];

export function getPrimitiveCssVar(familyId: string, shade: string): string {
  return `--color-${familyId}-${shade}`;
}

export function getPrimitiveTokenPath(familyLabel: string, shade: string): string {
  const shadeLabel = /^\d+$/.test(shade) ? shade : shade[0].toUpperCase() + shade.slice(1);
  return `Color.${familyLabel}.${shadeLabel}`;
}
