import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react' // 1. import 추가
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true }, // JSX 파싱 옵션 권장
      },
    },
    // 2. plugins에 'react' 추가 필수
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'react': react, 
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // 3. 규칙 적용 확인
      "react/no-unknown-property": [
        "error",
        {
          "ignore": [
            "position", "args", "roughness", "metalness", "geometry", "material",
            "dispose", "object", "castShadow", "receiveShadow", "intensity"
          ]
        }
      ],
    },
  },
)