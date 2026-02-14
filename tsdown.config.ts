import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["./src/index.ts", "./src/types.ts"],
    exports: {
        devExports: "dev",
    },
});
