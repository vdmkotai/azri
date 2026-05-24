// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { DeploymentMapDataSchema } from './schema.ts';

const validData = {
  title: 'Deployment map',
  deployments: [
    {
      component: 'API',
      runtime: 'Bun',
      host: 'railway',
      url: 'https://example.com',
      region: 'iad',
      notes: 'Primary service',
    },
  ],
};

describe('deployment-map schema', () => {
  test('accepts valid data', () => {
    const result = DeploymentMapDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty deployments array', () => {
    const result = DeploymentMapDataSchema.safeParse({
      title: 'Deployment map',
      deployments: [],
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid URL', () => {
    const result = DeploymentMapDataSchema.safeParse({
      title: 'Deployment map',
      deployments: [
        {
          component: 'API',
          runtime: 'Bun',
          host: 'railway',
          url: 'not-a-url',
          region: 'iad',
          notes: 'Primary service',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
