import type { Meta, StoryObj } from "@storybook/react-vite";

import Text, { type TextProps } from "./Text";

const WEIGHTS: TextProps["weight"][] = [
  "light",
  "regular",
  "medium",
  "semi-bold",
  "bold",
];

const SIZES: TextProps["size"][] = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"];

const COLORS: TextProps["color"][] = [
  "default",
  "subtle",
  "brand",
  "success",
  "error",
];

const FONT_FAMILIES: TextProps["fontFamily"][] = ["inter", "montserrat"];

const meta = {
  title: "Components/Text",
  component: Text,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Text components stay in sync when they read from tokens.",
  },
};

export const FontFamily: Story = {
  args: {
    fontFamily: "inter",
    size: "md",
    color: "default",
    weight: "regular",
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {FONT_FAMILIES.map((fontFamily) => (
        <Text key={fontFamily} {...args} fontFamily={fontFamily}>
          {fontFamily} font family
        </Text>
      ))}
    </div>
  ),
};

export const Heading: Story = {
  args: {
    as: "h2",
    size: "xl",
    weight: "semi-bold",
    children: "Section heading using responsive tokens",
  },
};

export const WeightScale: Story = {
  args: {
    size: "md",
    color: "default",
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {WEIGHTS.map((weight) => (
        <Text key={weight} {...args} weight={weight}>
          {weight} weight
        </Text>
      ))}
    </div>
  ),
};

export const SizeRamp: Story = {
  args: {
    weight: "regular",
    color: "default",
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {SIZES.map((size) => (
        <Text key={size} {...args} size={size}>
          {size} size uses the responsive typography tokens
        </Text>
      ))}
    </div>
  ),
};

export const ColorStates: Story = {
  args: {
    weight: "medium",
    size: "md",
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {COLORS.map((color) => (
        <Text key={color} {...args} color={color}>
          {color} text reinforces status semantics
        </Text>
      ))}
    </div>
  ),
};
