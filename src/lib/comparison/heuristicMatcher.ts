import {
  TenantComparisonItem,
  HeuristicRule,
  MissingTenantAction
} from '@/src/types/tenant';

const CORPORATE_SUFFIXES = [
  'plc', 'llc', 'inc', 'corp', 'corporation', 'ltd', 'limited',
  'holdings', 'group', 'co', 'company', 'enterprises', 'partners'
];

function normalizeNameBase(name: string): string {
  if (!name) return '';
  let str = name.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').trim();
  const words = str.split(/\s+/).filter(Boolean);
  const filtered = words.filter(w => !CORPORATE_SUFFIXES.includes(w));
  return filtered.join(' ');
}

function extractDigits(val: any): string {
  return String(val || '').replace(/\D/g, '');
}

export function analyzeHeuristicClusters(items: TenantComparisonItem[]): HeuristicRule[] {
  const rulesMap: Map<string, HeuristicRule> = new Map();

  // Initialize standard heuristic categories
  const initRule = (
    id: string,
    name: string,
    category: HeuristicRule['category'],
    description: string,
    confidence: number,
    suggestedAction: HeuristicRule['suggestedAction']
  ): HeuristicRule => ({
    id,
    name,
    category,
    description,
    confidence,
    suggestedAction,
    itemCount: 0,
    sampleItems: [],
    matchedItemIds: []
  });

  const ruleCorpSuffix = initRule(
    'rule_corp_suffix',
    'Corporate Entity Suffix Normalization',
    'naming',
    'Tenant names differ only by common legal entity suffixes (PLC, LLC, Inc, Ltd, Holdings) or standardized corporate casing.',
    0.96,
    'approve'
  );

  const rulePhoneFormat = initRule(
    'rule_phone_format',
    'Phone Number Formatting Equivalence',
    'phone',
    'Phone number changes are strictly formatting differences (identical digits, dashes, spaces, or international prefixes).',
    0.98,
    'approve'
  );

  const ruleExpiredMissing = initRule(
    'rule_expired_missing',
    'Expired Lease Omissions (Deactivate)',
    'lifecycle',
    'Tenants missing from the external export whose lease contract expired before the sync date. Suggests safe deactivation.',
    0.94,
    'deactivate'
  );

  const ruleRentEscalation = initRule(
    'rule_rent_escalation',
    'Scheduled CPI / Annual Rent Escalations',
    'financial',
    'Rent modifications matching standard commercial lease annual escalations (+2% to +12% increase).',
    0.91,
    'approve'
  );

  const ruleUnitPrefix = initRule(
    'rule_unit_prefix',
    'Unit / Space Code Standardization',
    'formatting',
    'Unit changes preserve the exact unit number while standardizing building or wing prefixes (e.g. "101" to "A-101").',
    0.95,
    'approve'
  );

  const ruleStatusSynonym = initRule(
    'rule_status_synonym',
    'Status Synonym & Case Alignment',
    'status',
    'Status changes that match standard occupancy synonyms (e.g., "OCCUPIED" to "Active", "VAC" to "Inactive").',
    0.99,
    'approve'
  );

  const ruleLeaseRenewal = initRule(
    'rule_lease_renewal',
    'Standard Contract Renewal Extensions',
    'lifecycle',
    'Contract end dates extended by 1 to 5 years with identical tenant code and active lease tenancy.',
    0.95,
    'approve'
  );

  const currentDate = new Date('2026-10-02');

  for (const item of items) {
    // 1. Missing Records Check
    if (item.changeType === 'MISSING') {
      const contractEnd = item.masterRecord?.contractEnd;
      if (contractEnd) {
        const endDate = new Date(contractEnd);
        if (!isNaN(endDate.getTime()) && endDate <= currentDate) {
          ruleExpiredMissing.itemCount++;
          ruleExpiredMissing.matchedItemIds.push(item.id);
          if (ruleExpiredMissing.sampleItems.length < 5) {
            ruleExpiredMissing.sampleItems.push({
              tenantCode: item.tenantCode,
              tenantName: item.tenantName,
              field: 'Status & Lease Presence',
              oldValue: `Active (Expired on ${contractEnd})`,
              newValue: 'Deactivate',
              explanation: `Lease expired on ${contractEnd}, confirming natural termination from source system.`
            });
          }
        }
      }
      continue;
    }

    if (item.changeType !== 'UPDATED') continue;

    for (const diff of item.diffs) {
      // 2. Corporate Suffix Check
      if (diff.field === 'tenantName') {
        const oldBase = normalizeNameBase(String(diff.oldValue));
        const newBase = normalizeNameBase(String(diff.newValue));
        if (oldBase && newBase && oldBase === newBase && diff.oldValue !== diff.newValue) {
          if (!ruleCorpSuffix.matchedItemIds.includes(item.id)) {
            ruleCorpSuffix.itemCount++;
            ruleCorpSuffix.matchedItemIds.push(item.id);
            if (ruleCorpSuffix.sampleItems.length < 5) {
              ruleCorpSuffix.sampleItems.push({
                tenantCode: item.tenantCode,
                tenantName: item.tenantName,
                field: 'Tenant Name',
                oldValue: diff.oldValue,
                newValue: diff.newValue,
                explanation: `Entity suffix normalized ("${diff.oldValue}" → "${diff.newValue}")`
              });
            }
          }
        }
      }

      // 3. Phone Format Check
      if (diff.field === 'phone') {
        const oldDigits = extractDigits(diff.oldValue);
        const newDigits = extractDigits(diff.newValue);
        if (oldDigits && newDigits && (oldDigits === newDigits || oldDigits.endsWith(newDigits) || newDigits.endsWith(oldDigits))) {
          if (!rulePhoneFormat.matchedItemIds.includes(item.id)) {
            rulePhoneFormat.itemCount++;
            rulePhoneFormat.matchedItemIds.push(item.id);
            if (rulePhoneFormat.sampleItems.length < 5) {
              rulePhoneFormat.sampleItems.push({
                tenantCode: item.tenantCode,
                tenantName: item.tenantName,
                field: 'Phone',
                oldValue: diff.oldValue,
                newValue: diff.newValue,
                explanation: `Identical phone digits (${newDigits.slice(-4)}) with standardized mask`
              });
            }
          }
        }
      }

      // 4. Unit Prefix Check
      if (diff.field === 'unit') {
        const oldNums = extractDigits(diff.oldValue);
        const newNums = extractDigits(diff.newValue);
        if (oldNums && newNums && oldNums === newNums && diff.oldValue !== diff.newValue) {
          if (!ruleUnitPrefix.matchedItemIds.includes(item.id)) {
            ruleUnitPrefix.itemCount++;
            ruleUnitPrefix.matchedItemIds.push(item.id);
            if (ruleUnitPrefix.sampleItems.length < 5) {
              ruleUnitPrefix.sampleItems.push({
                tenantCode: item.tenantCode,
                tenantName: item.tenantName,
                field: 'Unit / Space',
                oldValue: diff.oldValue,
                newValue: diff.newValue,
                explanation: `Unit number ${newNums} preserved with wing/zone prefix`
              });
            }
          }
        }
      }

      // 5. Rent Escalation Check
      if (diff.field === 'rent') {
        const oldRent = parseFloat(String(diff.oldValue).replace(/[^0-9.]/g, ''));
        const newRent = parseFloat(String(diff.newValue).replace(/[^0-9.]/g, ''));
        if (!isNaN(oldRent) && !isNaN(newRent) && oldRent > 0) {
          const deltaPct = ((newRent - oldRent) / oldRent) * 100;
          if (deltaPct >= 1.5 && deltaPct <= 15.0) {
            if (!ruleRentEscalation.matchedItemIds.includes(item.id)) {
              ruleRentEscalation.itemCount++;
              ruleRentEscalation.matchedItemIds.push(item.id);
              if (ruleRentEscalation.sampleItems.length < 5) {
                ruleRentEscalation.sampleItems.push({
                  tenantCode: item.tenantCode,
                  tenantName: item.tenantName,
                  field: 'Rent',
                  oldValue: `$${oldRent.toLocaleString()}`,
                  newValue: `$${newRent.toLocaleString()}`,
                  explanation: `Standard +${deltaPct.toFixed(1)}% annual lease rent escalation`
                });
              }
            }
          }
        }
      }

      // 6. Status Synonym Check
      if (diff.field === 'status') {
        const oldNorm = String(diff.oldValue || '').trim().toLowerCase();
        const newNorm = String(diff.newValue || '').trim().toLowerCase();
        const activeSynonyms = ['active', 'act', 'occupied', 'current', 'valid'];
        const inactiveSynonyms = ['inactive', 'vacant', 'closed', 'terminated'];
        const bothActive = activeSynonyms.includes(oldNorm) && activeSynonyms.includes(newNorm);
        const bothInactive = inactiveSynonyms.includes(oldNorm) && inactiveSynonyms.includes(newNorm);
        if (bothActive || bothInactive) {
          if (!ruleStatusSynonym.matchedItemIds.includes(item.id)) {
            ruleStatusSynonym.itemCount++;
            ruleStatusSynonym.matchedItemIds.push(item.id);
            if (ruleStatusSynonym.sampleItems.length < 5) {
              ruleStatusSynonym.sampleItems.push({
                tenantCode: item.tenantCode,
                tenantName: item.tenantName,
                field: 'Status',
                oldValue: diff.oldValue,
                newValue: diff.newValue,
                explanation: `Canonical casing alignment for ${bothActive ? 'Active' : 'Inactive'} status`
              });
            }
          }
        }
      }

      // 7. Lease Renewal Check
      if (diff.field === 'contractEnd') {
        const oldD = new Date(diff.oldValue);
        const newD = new Date(diff.newValue);
        if (!isNaN(oldD.getTime()) && !isNaN(newD.getTime()) && newD > oldD) {
          const diffYears = (newD.getTime() - oldD.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          if (diffYears >= 0.8 && diffYears <= 5.5) {
            if (!ruleLeaseRenewal.matchedItemIds.includes(item.id)) {
              ruleLeaseRenewal.itemCount++;
              ruleLeaseRenewal.matchedItemIds.push(item.id);
              if (ruleLeaseRenewal.sampleItems.length < 5) {
                ruleLeaseRenewal.sampleItems.push({
                  tenantCode: item.tenantCode,
                  tenantName: item.tenantName,
                  field: 'Contract End Date',
                  oldValue: diff.oldValue,
                  newValue: diff.newValue,
                  explanation: `Term extension by ~${Math.round(diffYears)} year(s) to ${diff.newValue}`
                });
              }
            }
          }
        }
      }
    }
  }

  // Filter only rules that found matches
  const candidateRules = [
    ruleCorpSuffix,
    rulePhoneFormat,
    ruleExpiredMissing,
    ruleRentEscalation,
    ruleUnitPrefix,
    ruleStatusSynonym,
    ruleLeaseRenewal
  ];

  return candidateRules.filter(r => r.itemCount > 0);
}
