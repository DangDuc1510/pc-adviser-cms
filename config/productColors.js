/**
 * Product Colors Configuration
 * Common colors for PC components and accessories
 */

export const PRODUCT_COLORS = [
  {
    name: "Đen",
    value: "black",
    hex: "#000000",
    rgb: { r: 0, g: 0, b: 0 },
  },
  {
    name: "Trắng",
    value: "white",
    hex: "#FFFFFF",
    rgb: { r: 255, g: 255, b: 255 },
  },
  {
    name: "Xám",
    value: "gray",
    hex: "#808080",
    rgb: { r: 128, g: 128, b: 128 },
  },
  {
    name: "Xám đen",
    value: "dark-gray",
    hex: "#404040",
    rgb: { r: 64, g: 64, b: 64 },
  },
  {
    name: "Xám nhạt",
    value: "light-gray",
    hex: "#C0C0C0",
    rgb: { r: 192, g: 192, b: 192 },
  },
  {
    name: "Đỏ",
    value: "red",
    hex: "#FF0000",
    rgb: { r: 255, g: 0, b: 0 },
  },
  {
    name: "Xanh dương",
    value: "blue",
    hex: "#0000FF",
    rgb: { r: 0, g: 0, b: 255 },
  },
  {
    name: "Xanh lá",
    value: "green",
    hex: "#00FF00",
    rgb: { r: 0, g: 255, b: 0 },
  },
  {
    name: "Vàng",
    value: "yellow",
    hex: "#FFFF00",
    rgb: { r: 255, g: 255, b: 0 },
  },
  {
    name: "Cam",
    value: "orange",
    hex: "#FFA500",
    rgb: { r: 255, g: 165, b: 0 },
  },
  {
    name: "Hồng",
    value: "pink",
    hex: "#FFC0CB",
    rgb: { r: 255, g: 192, b: 203 },
  },
  {
    name: "Tím",
    value: "purple",
    hex: "#800080",
    rgb: { r: 128, g: 0, b: 128 },
  },
  {
    name: "Xanh ngọc",
    value: "cyan",
    hex: "#00FFFF",
    rgb: { r: 0, g: 255, b: 255 },
  },
  {
    name: "Nâu",
    value: "brown",
    hex: "#A52A2A",
    rgb: { r: 165, g: 42, b: 42 },
  },
  {
    name: "Bạc",
    value: "silver",
    hex: "#C0C0C0",
    rgb: { r: 192, g: 192, b: 192 },
  },
  {
    name: "Vàng đồng",
    value: "gold",
    hex: "#FFD700",
    rgb: { r: 255, g: 215, b: 0 },
  },
  {
    name: "RGB",
    value: "rgb",
    hex: "#FF00FF",
    rgb: { r: 255, g: 0, b: 255 },
  },
  {
    name: "Xanh RGB",
    value: "rgb-blue",
    hex: "#00BFFF",
    rgb: { r: 0, g: 191, b: 255 },
  },
  {
    name: "Đỏ RGB",
    value: "rgb-red",
    hex: "#FF1493",
    rgb: { r: 255, g: 20, b: 147 },
  },
  {
    name: "Xanh lá RGB",
    value: "rgb-green",
    hex: "#00FF7F",
    rgb: { r: 0, g: 255, b: 127 },
  },
];

/**
 * Get color by value
 * @param {string} value - Color value
 * @returns {Object|null} Color object or null
 */
export const getColorByValue = (value) => {
  return PRODUCT_COLORS.find((color) => color.value === value) || null;
};

/**
 * Get color name by value
 * @param {string} value - Color value
 * @returns {string} Color name or value
 */
export const getColorName = (value) => {
  const color = getColorByValue(value);
  return color ? color.name : value;
};

/**
 * Get all color values
 * @returns {Array<string>} Array of color values
 */
export const getAllColorValues = () => {
  return PRODUCT_COLORS.map((color) => color.value);
};

/**
 * Get color options for Select component
 * @returns {Array} Array of { label, value } objects
 */
export const getColorOptions = () => {
  return PRODUCT_COLORS.map((color) => ({
    label: (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 16,
            height: 16,
            backgroundColor: color.hex,
            border: "1px solid #d9d9d9",
            borderRadius: 2,
          }}
        />
        <span>{color.name}</span>
      </div>
    ),
    value: color.value,
    color: color,
  }));
};
