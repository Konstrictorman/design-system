import type { Meta, StoryObj } from "@storybook/react-vite";

import ColorPrimitivesPalette from "./ColorPrimitivesPalette";

const meta = {
  title: "Foundation/Color Primitives",
  component: ColorPrimitivesPalette,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ColorPrimitivesPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Palette: Story = {};
