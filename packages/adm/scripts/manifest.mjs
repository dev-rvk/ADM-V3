import fs from "node:fs";

const baseUrl = (process.env.BASE_PATH ?? "") + "/";

fs.writeFileSync(
    new URL("../public/manifest.json", import.meta.url),
    JSON.stringify(
        {
            name: "ADM Emulator",
            short_name: "ADM",
            categories: ["utilities", "developer"],
            description: "Run Emulators in Browser",
            scope: baseUrl,
            start_url: baseUrl,
            background_color: "#ffffff",
            display: "standalone",
            icons: [
                {
                    src: "favicon-256.png",
                    type: "image/png",
                    sizes: "256x256",
                },
            ],
        },
        undefined,
        4
    ),
    "utf8"
);
