// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

export * from './types.ts';
export * from './errors.ts';
export * from './registry.ts';

export { architectureDecisionSection } from './architecture-decision/index.ts';
export { codeWalkthroughSection } from './code-walkthrough/index.ts';
export { mermaidDiagramSection } from './mermaid-diagram/index.ts';
export { quoteCalloutSection } from './quote-callout/index.ts';

export { dataTableSection } from './data-table/index.ts';
export { comparisonTableSection } from './comparison-table/index.ts';
export { riskCalloutSection } from './risk-callout/index.ts';
export { linkCalloutSection } from './link-callout/index.ts';

export { tldrSection } from './tldr/index.ts';
export { stackGridSection } from './stack-grid/index.ts';
export { entityGridSection } from './entity-grid/index.ts';
export { entityCardSection } from './entity-card/index.ts';

export { projectOverviewSection } from './project-overview/index.ts';
export { userFlowSection } from './user-flow/index.ts';
export { uiOverviewSection } from './ui-overview/index.ts';
export { featureListSection } from './feature-list/index.ts';

export { dataFlowDiagramSection } from './data-flow-diagram/index.ts';
export { deploymentMapSection } from './deployment-map/index.ts';
export { directoryTreeSection } from './directory-tree/index.ts';
export { keyFilesSection } from './key-files/index.ts';

export { databaseSchemaSection } from './database-schema/index.ts';
export { apiSurfaceSection } from './api-surface/index.ts';
export { gettingStartedSection } from './getting-started/index.ts';
export { whatsNextSection } from './whats-next/index.ts';
export { glossarySection } from './glossary/index.ts';

export { prTldrSection } from './pr-tldr/index.ts';
export { changeSummarySection } from './change-summary/index.ts';
export { annotatedDiffSection } from './annotated-diff/index.ts';
export { beforeAfterFlowSection } from './before-after-flow/index.ts';

export { investigationSection } from './investigation/index.ts';
export { testImpactSection } from './test-impact/index.ts';
export { regressionRiskSection } from './regression-risk/index.ts';
export { migrationNotesSection } from './migration-notes/index.ts';

export { verificationChecklistSection } from './verification-checklist/index.ts';
export { linkedIssuesSection } from './linked-issues/index.ts';
export { reviewerGuideSection } from './reviewer-guide/index.ts';
export { rollbackPlanSection } from './rollback-plan/index.ts';
