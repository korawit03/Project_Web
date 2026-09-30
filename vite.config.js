export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), ...(command === "serve" ? [mkcert()] : [])],
  server: { host: true },
}));