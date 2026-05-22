// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { designSystem, colorsDark, type DesignSystem } from './tokens.ts';

export const RESET_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:24px}
body{margin:0;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased}
img,svg{display:block;max-width:100%;height:auto}
button{font:inherit}
`;

export function tokenCss(ds: DesignSystem, dark: typeof colorsDark = colorsDark): string {
  return `
:root{
  --color-text:${ds.colors.text};
  --color-bg:${ds.colors.background};
  --color-accent:${ds.colors.accent};
  --severity-info:${ds.colors.severity.info};
  --severity-warn:${ds.colors.severity.warn};
  --severity-critical:${ds.colors.severity.critical};
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
    --color-text:${dark.text};
    --color-bg:${dark.background};
    --color-accent:${dark.accent};
    --severity-info:${dark.severity.info};
    --severity-warn:${dark.severity.warn};
    --severity-critical:${dark.severity.critical};
  }
}
`;
}

export const TOKEN_CSS = tokenCss(designSystem, colorsDark);

export interface UserTokens {
  colors?: Partial<Omit<DesignSystem['colors'], 'severity'>> & {
    severity?: Partial<DesignSystem['colors']['severity']>;
  };
  typefaces?: Partial<DesignSystem['typefaces']>;
}

export function applyDesignTokens(user?: UserTokens): DesignSystem {
  if (!user) return designSystem;
  return {
    ...designSystem,
    colors: {
      text: user.colors?.text ?? designSystem.colors.text,
      background: user.colors?.background ?? designSystem.colors.background,
      accent: user.colors?.accent ?? designSystem.colors.accent,
      severity: {
        info: user.colors?.severity?.info ?? designSystem.colors.severity.info,
        warn: user.colors?.severity?.warn ?? designSystem.colors.severity.warn,
        critical: user.colors?.severity?.critical ?? designSystem.colors.severity.critical,
      },
    },
    typefaces: {
      serif: user.typefaces?.serif ?? designSystem.typefaces.serif,
      mono: user.typefaces?.mono ?? designSystem.typefaces.mono,
    },
  };
}
