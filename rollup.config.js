import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

// const external = Object.keys(pkg.dependencies).concat([
//   'path',
//   'fs',
//   'typescript',
// ])

export default [
  {
    input: 'src/index.ts',
    output: {
      name: 'webrtc-mesh',
      file: pkg.browser,
      format: 'umd',
    },
    plugins: [
      resolve(), // so Rollup can find `ms`
      commonjs(), // so Rollup can convert `ms` to an ES module
      typescript(), // so Rollup can convert TypeScript to JavaScript
    ],
  },
  {
    input: 'src/index.ts',
    plugins: [
      typescript(), // so Rollup can convert TypeScript to JavaScript
    ],
    // external,
    output: [
      { format: 'cjs', file: pkg.main, exports: 'auto' },
      { format: 'esm', file: pkg.module },
    ],
  },
]
