const withMDX = require("@next/mdx")({
    extension: /\.mdx?$/,
    options: {
        // Disable MDX createElement hack
        // because we don't need rendering custom elements
        jsx: true,
    },
});

const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
});

const basePath = process.env.BASE_PATH ?? "";

const withPwa = require("@yume-chan/next-pwa")({
    dest: "public",
});

function pipe(value, ...callbacks) {
    for (const callback of callbacks) {
        value = callback(value);
    }
    return value;
}

module.exports = pipe(
    /** @type {import('next').NextConfig} */ ({
        basePath,
        pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
        reactStrictMode: false,
        productionBrowserSourceMaps: true,
        experimental: {
            // Workaround https://github.com/vercel/next.js/issues/33914
            esmExternals: "loose",
        },
        publicRuntimeConfig: {
            basePath,
        },
        webpack(config) {
            config.module.rules.push(
                {
                    test: /\.tsx?$/, // Matches .ts and .tsx files
                    exclude: /node_modules/, // Excludes dependencies
                    use: [
                        {
                            loader: "ts-loader",
                            options: {
                                transpileOnly: true, // Improves build speed by skipping type checking
                            },
                        },
                    ],
                },
                {
                    test: /.*\.m?js$/,
                    exclude: [/next/],
                    use: ["source-map-loader"],
                    enforce: "pre",
                }
            );

            return config;
        },
        // Enable Direct Sockets API
        async headers() {
            return [
                {
                    source: "/:path*",
                    headers: [
                        {
                            key: "Cross-Origin-Opener-Policy",
                            value: "same-origin",
                        },
                        {
                            key: "Cross-Origin-Embedder-Policy",
                            value: "credentialless",
                        },
                    ],
                },
            ];
        },
        poweredByHeader: false,
    }),
    withBundleAnalyzer,
    withPwa,
    withMDX
);
