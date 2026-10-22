// vite.config.js
import { defineConfig } from "file:///D:/site-work/site-work-app/node_modules/vite/dist/node/index.js";
import react from "file:///D:/site-work/site-work-app/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///D:/site-work/site-work-app/node_modules/@tailwindcss/vite/dist/index.mjs";
import mkcert from "file:///D:/site-work/site-work-app/node_modules/vite-plugin-mkcert/dist/index.mjs";
var vite_config_default = defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), ...command === "serve" ? [mkcert()] : []],
  server: { host: true }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxzaXRlLXdvcmtcXFxcc2l0ZS13b3JrLWFwcFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcc2l0ZS13b3JrXFxcXHNpdGUtd29yay1hcHBcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3NpdGUtd29yay9zaXRlLXdvcmstYXBwL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tIFwiQHRhaWx3aW5kY3NzL3ZpdGVcIjtcbmltcG9ydCBta2NlcnQgZnJvbSBcInZpdGUtcGx1Z2luLW1rY2VydFwiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgY29tbWFuZCB9KSA9PiAoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKSwgLi4uKGNvbW1hbmQgPT09IFwic2VydmVcIiA/IFtta2NlcnQoKV0gOiBbXSldLFxuICBzZXJ2ZXI6IHsgaG9zdDogdHJ1ZSB9LFxufSkpOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBc1EsU0FBUyxvQkFBb0I7QUFDblMsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sWUFBWTtBQUVuQixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLFFBQVEsT0FBTztBQUFBLEVBQzVDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxHQUFHLEdBQUksWUFBWSxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFFO0FBQUEsRUFDNUUsUUFBUSxFQUFFLE1BQU0sS0FBSztBQUN2QixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
