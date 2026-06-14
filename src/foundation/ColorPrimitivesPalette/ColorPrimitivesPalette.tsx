import Text from "../../components/Text/Text";
import styles from "./color-primitives-palette.module.css";
import {
  COLOR_PRIMITIVE_FAMILIES,
  getPrimitiveCssVar,
  getPrimitiveTokenPath,
} from "./colorPrimitives";

const ColorPrimitivesPalette = () => {
  return (
    <div className={styles.palette}>
      <div className={styles.intro}>
        <Text as="h2" size="xl" weight="semi-bold">
          Color primitives
        </Text>
        <Text size="sm" color="subtle">
          Raw palette tokens from options/global. These values are shared across
          light and dark themes.
        </Text>
      </div>

      {COLOR_PRIMITIVE_FAMILIES.map((family) => (
        <section key={family.id} className={styles.family}>
          <h3 className={styles.familyName}>{family.label}</h3>
          <div className={styles.swatches}>
            {family.shades.map((shade) => {
              const cssVar = getPrimitiveCssVar(family.id, shade);

              return (
                <div key={shade} className={styles.swatch}>
                  <div
                    className={styles.sample}
                    style={{ backgroundColor: `var(${cssVar})` }}
                  />
                  <div className={styles.meta}>
                    <span className={styles.tokenPath}>
                      {getPrimitiveTokenPath(family.label, shade)}
                    </span>
                    <span>{cssVar}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ColorPrimitivesPalette;
