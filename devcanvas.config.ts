const devcanvasConfig = {
  entry: "app/tianyi",
  mode: "production-ui",
  transformer: "app/tianyi/worldModelDraftTransformer.ts",
  runtime: "core/engine/DevCanvasEngine.ts",
  ui: {
    surface: "TianyiImmersiveWorkspace",
    sourceReading: "Creative Mode",
    schema: "types/worldModelDraft.ts",
  },
  deployment: {
    target: "cloudflare-pages-preview",
    status: "preview-ready-metadata",
    envRequired: [],
  },
};

export default devcanvasConfig;
