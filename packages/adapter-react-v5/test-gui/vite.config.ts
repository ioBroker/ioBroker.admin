import type { UserConfig } from 'vite';

export default {
    build: {
        outDir: 'build',
        sourcemap: true,
        rollupOptions: {
            onwarn: (warning: any, warn: (log: any) => void) => {
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'SOURCEMAP_ERROR') {
                    return;
                }
                warn(warning);
            },
        },
    },
    base: './',
    server: {
        port: 3000,
    },
} satisfies UserConfig;
