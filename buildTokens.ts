import StyleDictionary from "style-dictionary";
import type { Dictionary, TransformedToken } from "style-dictionary";
import { register, getTransforms } from "@tokens-studio/sd-transforms";
import fs from "fs";
import { fileURLToPath } from "url";

type TokenValue = {
  value: string;
  type: string;
  [key: string]: unknown;
};

type TokenObject = {
  [key: string]: TokenValue | TokenObject;
};

type TokensFile = TokenObject & {
  $metadata?: {
    tokenSetOrder?: string[];
  };
  $themes?: Theme[];
};

type Theme = {
  id: string;
  name: string;
  selectedTokenSets: Record<string, string>;
};

type TokenMap = Map<string, TransformedToken>;

const MOBILE_SET_NAME = "s-responsive/Mobile";
const DESKTOP_SET_NAME = "s-responsive/Desktop";
const LIGHT_THEME_ID = "light";
const DARK_THEME_ID = "dark";
const DARK_THEME_SELECTOR = '[data-theme="dark"]';
const THEME_COLOR_KEY_PREFIX = "color.";
const OUTPUT_PATH = fileURLToPath(new URL("./src/tokens.css", import.meta.url));
const tokensPath = fileURLToPath(new URL("tokens.json", import.meta.url));
const tokens: TokensFile = JSON.parse(fs.readFileSync(tokensPath, "utf8"));

// fixes fontWeight tokens that were exported with the type of "text" due to Figma's setup
function fixFontWeightTypes(
  obj: TokenObject | TokenValue,
  isInFontWeight = false,
): void {
  if (typeof obj !== "object" || obj === null) {
    return;
  }

  if (isInFontWeight && "type" in obj && obj.type === "text") {
    obj.type = "fontWeight";
  }

  for (const key in obj) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      const newIsInFontWeight = key === "fontWeight" || isInFontWeight;
      fixFontWeightTypes(
        obj[key] as TokenObject | TokenValue,
        newIsInFontWeight,
      );
    }
  }
}

// checks if a value is a leaf token entry
function isTokenValue(
  value: TokenValue | TokenObject | undefined,
): value is TokenValue {
  return Boolean(value && typeof value === "object" && "value" in value);
}

// recursively merges two token objects without losing leaf nodes
function deepMerge(
  target: TokenObject,
  source: TokenObject | undefined,
): TokenObject {
  if (!source) {
    return target;
  }

  const result: TokenObject = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      typeof targetValue === "object" &&
      targetValue !== null &&
      !isTokenValue(sourceValue) &&
      !isTokenValue(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as TokenObject,
        sourceValue as TokenObject,
      );
    } else {
      result[key] = sourceValue;
    }
  }

  return result;
}

// reads the token set order from metadata
function getTokenSetOrder(): string[] {
  const order = tokens.$metadata?.tokenSetOrder;
  if (!Array.isArray(order) || order.length === 0) {
    throw new Error("Token set order metadata is missing.");
  }
  return order;
}

// reads configured themes from metadata
function getThemes(): Theme[] {
  const themes = tokens.$themes;
  if (!Array.isArray(themes) || themes.length === 0) {
    throw new Error("Themes metadata is missing.");
  }
  return themes;
}

// finds a theme by id
function getThemeById(themeId: string): Theme {
  const theme = getThemes().find((entry) => entry.id === themeId);
  if (!theme) {
    throw new Error(`Missing theme "${themeId}".`);
  }
  return theme;
}

// returns enabled sets for a theme up to and including the target set
function getEnabledSetsForTheme(theme: Theme, targetSet: string): string[] {
  const order = getTokenSetOrder();
  const targetIndex = order.indexOf(targetSet);
  if (targetIndex === -1) {
    throw new Error(`Missing token set "${targetSet}" in tokenSetOrder.`);
  }

  return order
    .slice(0, targetIndex + 1)
    .filter((setName) => theme.selectedTokenSets[setName] === "enabled");
}

// merges multiple token sets into a single object
function mergeTokenSets(setNames: string[]): TokenObject {
  return setNames.reduce<TokenObject>((acc, setName) => {
    const currentSet = tokens[setName];
    if (!currentSet || typeof currentSet !== "object") {
      throw new Error(`Token set "${setName}" is not defined.`);
    }
    return deepMerge(acc, currentSet as TokenObject);
  }, {});
}

// builds a Style Dictionary dictionary from a list of set names
async function createDictionaryForSets(
  setNames: string[],
  transforms: string[],
): Promise<Dictionary> {
  const mergedTokens = mergeTokenSets(setNames);
  const sd = new StyleDictionary({
    tokens: mergedTokens,
    platforms: {
      base: {
        transforms,
      },
    },
  });

  await sd.init();
  return sd.getPlatformTokens("base");
}

// converts camel or spaced strings into kebab-case
function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

// converts a token to its css custom property name
function getCssVarName(token: TransformedToken, prefix: string): string {
  const segments = token.path.slice(1).map(toKebabCase);
  return `--${prefix}-${segments.join("-")}`;
}

// builds a map of tokens under a given root key to their values
function extractTokenMap(
  tokens: TransformedToken[],
  rootKey: string,
): TokenMap {
  return tokens.reduce<TokenMap>((map, token) => {
    if (!Array.isArray(token.path) || token.path[0] !== rootKey) {
      return map;
    }
    const key = token.path.slice(1).join(".");
    map.set(key, token);
    return map;
  }, new Map());
}

// turns a token map into sorted css custom property lines
function buildCssVarLines(
  tokenMap: TokenMap,
  prefix: string,
  indent = "  ",
): string[] {
  return Array.from(tokenMap.keys())
    .sort()
    .map((key) => {
      const token = tokenMap.get(key);
      if (!token) {
        return null;
      }
      return `${indent}${getCssVarName(token, prefix)}: ${token.value};`;
    })
    .filter((line): line is string => Boolean(line));
}

// builds responsive typography overrides shared across themes
function buildDesktopOverrideLines(
  mobileTextMap: TokenMap,
  desktopTextMap: TokenMap,
  indent: string,
): string[] {
  const sortedTextKeys = Array.from(mobileTextMap.keys()).sort();
  const desktopOverrideKeys = sortedTextKeys.filter(
    (key) => key.startsWith("fontSize.") || key.startsWith("lineHeight."),
  );

  return desktopOverrideKeys
    .map((key) => {
      const token = desktopTextMap.get(key);
      if (!token) {
        return null;
      }
      return `${indent}${getCssVarName(token, "text")}: ${token.value};`;
    })
    .filter((line): line is string => Boolean(line));
}

// builds only the color tokens that differ between themes
function buildThemedColorOverrideLines(
  lightTextMap: TokenMap,
  darkTextMap: TokenMap,
  indent = "  ",
): string[] {
  return Array.from(darkTextMap.keys())
    .filter((key) => key.startsWith(THEME_COLOR_KEY_PREFIX))
    .sort()
    .map((key) => {
      const darkToken = darkTextMap.get(key);
      const lightToken = lightTextMap.get(key);
      if (!darkToken) {
        return null;
      }
      if (lightToken?.value === darkToken.value) {
        return null;
      }
      return `${indent}${getCssVarName(darkToken, "text")}: ${darkToken.value};`;
    })
    .filter((line): line is string => Boolean(line));
}

// generates css variable output with shared tokens in :root and color-only dark overrides
function buildCssOutput(
  lightMobileTokens: TransformedToken[],
  lightDesktopTokens: TransformedToken[],
  darkMobileTokens: TransformedToken[],
): string {
  const colorMap = extractTokenMap(lightMobileTokens, "Color");
  const scaleMap = extractTokenMap(lightMobileTokens, "Scale");
  const lightMobileTextMap = extractTokenMap(lightMobileTokens, "text");
  const lightDesktopTextMap = extractTokenMap(lightDesktopTokens, "text");
  const darkMobileTextMap = extractTokenMap(darkMobileTokens, "text");

  const colorLines = buildCssVarLines(colorMap, "color");
  const scaleLines = buildCssVarLines(scaleMap, "scale");
  const lightTextLines = buildCssVarLines(lightMobileTextMap, "text");
  const darkColorLines = buildThemedColorOverrideLines(
    lightMobileTextMap,
    darkMobileTextMap,
  );
  const lightDesktopLines = buildDesktopOverrideLines(
    lightMobileTextMap,
    lightDesktopTextMap,
    "    ",
  );

  const lines = [
    "/**",
    " * Do not edit directly, this file was auto-generated.",
    " */",
    "",
    ":root {",
    ...colorLines,
    ...scaleLines,
    ...lightTextLines,
    "}",
  ];

  if (darkColorLines.length > 0) {
    lines.push("", DARK_THEME_SELECTOR + " {", ...darkColorLines, "}");
  }

  if (lightDesktopLines.length > 0) {
    lines.push(
      "",
      "@media only screen and (min-width: 1025px) {",
      "  :root {",
      ...lightDesktopLines,
      "  }",
      "}",
    );
  }

  lines.push("");
  return lines.join("\n");
}

fixFontWeightTypes(tokens);

// orchestrates generation of css variables from the responsive token sets
async function buildTokens(): Promise<void> {
  await register(StyleDictionary);
  const tokensStudioTransforms = getTransforms();
  const transforms = ["name/kebab", ...tokensStudioTransforms];
  const lightTheme = getThemeById(LIGHT_THEME_ID);
  const darkTheme = getThemeById(DARK_THEME_ID);
  const lightMobileSets = getEnabledSetsForTheme(lightTheme, MOBILE_SET_NAME);
  const lightDesktopSets = getEnabledSetsForTheme(lightTheme, DESKTOP_SET_NAME);
  const darkMobileSets = getEnabledSetsForTheme(darkTheme, MOBILE_SET_NAME);
  const [lightMobileDictionary, lightDesktopDictionary, darkMobileDictionary] =
    await Promise.all([
      createDictionaryForSets(lightMobileSets, transforms),
      createDictionaryForSets(lightDesktopSets, transforms),
      createDictionaryForSets(darkMobileSets, transforms),
    ]);

  const cssOutput = buildCssOutput(
    lightMobileDictionary.allTokens,
    lightDesktopDictionary.allTokens,
    darkMobileDictionary.allTokens,
  );

  fs.writeFileSync(OUTPUT_PATH, cssOutput);
}

buildTokens().catch((error) => {
  console.error(error);
  process.exit(1);
});
