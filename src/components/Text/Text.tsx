import clsx from "clsx";
import style from "./text.module.css";

type TextElement =
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "span"
  | "strong"
  | "em"
  | "label"
  | "caption";

type TextWeight = "light" | "regular" | "medium" | "bold" | "semi-bold";

type TextSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface TextProps {
  as?: TextElement;
  fontFamily?: "inter" | "montserrat";
  children: React.ReactNode;
  size?: TextSize;
  color?: "default" | "subtle" | "brand" | "success" | "error";
  weight?: TextWeight;
}

const Text = ({
  as: Component = "p",
  fontFamily = "inter",
  children,
  size = "md",
  color = "default",
  weight = "regular",
  ...rest
}: TextProps) => {
  return (
    <Component
      className={clsx(
        style[`text--${fontFamily}`],
        style[`text--size-${size}`],
        style[`text--color-${color}`],
        style[`text--weight-${weight}`],
      )}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default Text;
