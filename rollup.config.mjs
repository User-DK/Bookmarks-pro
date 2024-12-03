import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';

export default [
  {
    input: 'sidepanel/index.js',
    output: {
      dir: 'dist/sidepanel',
      format: 'es',
    },
    plugins: [
      commonjs(),
      nodeResolve(),
      copy({
        targets: [
          {
            src: ['manifest.json', 'background.js', 'sidepanel', 'images'],
            dest: 'dist'
          }
        ]
      })
    ]
  },
  {
    input: 'scripts/extract-content.js',
    output: {
      dir: 'dist/scripts',
      format: 'es'
    },
    plugins: [
      commonjs(),
      nodeResolve(),
    ]
  },
  {
    input: ['lib/db.js', 'lib/summ_rewrite.js', 'lib/extraction.js'],
    output: {
      dir: 'dist/lib', // Use 'dir' instead of 'file' for multiple inputs
      format: 'es'
    },
    plugins: [
      commonjs(),
      nodeResolve(),
      copy({
        targets: [
          {
            src: ['lib/db.js', 'lib/summ_rewrite.js', 'lib/extraction.js'],
            dest: 'dist/lib'
          }
        ]
      })
    ]
  }
];
