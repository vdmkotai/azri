// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import {
  designSystem,
  colorsDark,
  type ColorTokens,
  type DesignSystem,
  type RadiiTokens,
  type ShadowTokens,
  type SpacingTokens,
} from './tokens.ts';

export const RESET_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:24px}
body{margin:0;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased}
img,svg{display:block;max-width:100%;height:auto}
button{font:inherit}
`;

export function tokenCss(ds: DesignSystem, dark?: ColorTokens): string {
  const darkResolved = dark ?? ds.darkColors ?? colorsDark;
  return `
:root{
  --color-text:${ds.colors.text};
  --color-bg:${ds.colors.background};
  --color-accent:${ds.colors.accent};
  --severity-info:${ds.colors.severity.info};
  --severity-warn:${ds.colors.severity.warn};
  --severity-critical:${ds.colors.severity.critical};
  --color-bg-code-background:${ds.colors.bgCode.background};
  --color-bg-code-text:${ds.colors.bgCode.text};
  --typeface-serif:${ds.typefaces.serif};
  --typeface-mono:${ds.typefaces.mono};
  --space-xs:${ds.spacing.xs}px;
  --space-sm:${ds.spacing.sm}px;
  --space-md:${ds.spacing.md}px;
  --space-lg:${ds.spacing.lg}px;
  --space-xl:${ds.spacing.xl}px;
  --space-2xl:${ds.spacing['2xl']}px;
  --space-3xl:${ds.spacing['3xl']}px;
  --space-4xl:${ds.spacing['4xl']}px;
  --radius-sm:${ds.radii.sm}px;
  --radius-md:${ds.radii.md}px;
  --radius-lg:${ds.radii.lg}px;
  --shadow-subtle:${ds.shadows.subtle};
  --shadow-lifted:${ds.shadows.lifted};
}
@media (prefers-color-scheme:dark){
  :root{
    --color-text:${darkResolved.text};
    --color-bg:${darkResolved.background};
    --color-accent:${darkResolved.accent};
    --severity-info:${darkResolved.severity.info};
    --severity-warn:${darkResolved.severity.warn};
    --severity-critical:${darkResolved.severity.critical};
  }
}
`;
}

export const TOKEN_CSS = tokenCss(designSystem, colorsDark);

export interface UserTokens {
  colors?: Partial<Omit<DesignSystem['colors'], 'severity' | 'bgCode'>> & {
    severity?: Partial<DesignSystem['colors']['severity']>;
    bgCode?: Partial<DesignSystem['colors']['bgCode']>;
  };
  typefaces?: Partial<DesignSystem['typefaces']>;
  spacing?: Partial<SpacingTokens>;
  radii?: Partial<RadiiTokens>;
  shadows?: Partial<ShadowTokens>;
}

export function applyDesignTokens(user?: UserTokens, base?: DesignSystem): DesignSystem {
  const root = base ?? designSystem;
  if (!user) return root;
  const merged: DesignSystem = {
    ...root,
    colors: {
      text: user.colors?.text ?? root.colors.text,
      background: user.colors?.background ?? root.colors.background,
      accent: user.colors?.accent ?? root.colors.accent,
      severity: {
        info: user.colors?.severity?.info ?? root.colors.severity.info,
        warn: user.colors?.severity?.warn ?? root.colors.severity.warn,
        critical: user.colors?.severity?.critical ?? root.colors.severity.critical,
      },
      bgCode: {
        background: user.colors?.bgCode?.background ?? root.colors.bgCode.background,
        text: user.colors?.bgCode?.text ?? root.colors.bgCode.text,
      },
    },
    typefaces: {
      serif: user.typefaces?.serif ?? root.typefaces.serif,
      mono: user.typefaces?.mono ?? root.typefaces.mono,
    },
    spacing: { ...root.spacing, ...user.spacing },
    radii: { ...root.radii, ...user.radii },
    shadows: { ...root.shadows, ...user.shadows },
  };
  if (root.darkColors) merged.darkColors = root.darkColors;
  return merged;
}
