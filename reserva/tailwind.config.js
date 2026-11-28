/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B1D24",
        mute: "#5E6472",
        lapis: "#2A5C9A",
        sage: "#4D6B57",
        cream: "#F5F1E8",
        melon: "#FFB58A",
        line: "#E4E1D8",
      },
      fontFamily: {
        display: ['"Inter Tight"', "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(27,29,36,.04), 0 18px 48px -18px rgba(27,29,36,.18)",
      },
      borderRadius: { panel: "22px", card: "30px", wide: "32px" },
    },
  },
  plugins: [],
};
