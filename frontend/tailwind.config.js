
// @type {import('tailwindcss').Config}
export default {
    content: ["./src/**/*.{html,js,svelte,ts}"],
    theme: {
        extend: {
            colors: {
                mcast: {
                    blue: "#0f5C80",
                    dark: "#202114",
                    accent: "#D97706",
                    light: "#F0F4F3"
                },
            },
            fontFamily: {
                mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
            },
        },
    },
    plugins: [],
}