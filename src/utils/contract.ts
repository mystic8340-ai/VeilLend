import { VeilLendProtocol } from '../midnight/veillendSimulator';
import { PREPROD_CONTRACT_ADDRESS } from '../midnight/midnight1am';
import { CreditTier, PublicLedgerState } from '../midnight/contractTypes';

export const CONTRACT_ADDRESS = PREPROD_CONTRACT_ADDRESS;

export async function fetchContractLedgerState(): Promise<PublicLedgerState> {
  const protocol = VeilLendProtocol.getInstance();
  return protocol.getLedgerState();
}

export function formatCompactAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export function getTierLimits(tier: CreditTier): { maxBorrow: number; collateralPct: number; apr: number } {
  switch (tier) {
    case CreditTier.TIER_1_PRIME:
      return { maxBorrow: 50000, collateralPct: 0, apr: 3.8 };
    case CreditTier.TIER_2_STANDARD:
      return { maxBorrow: 25000, collateralPct: 25, apr: 6.5 };
    case CreditTier.TIER_3_ENTRY:
      return { maxBorrow: 10000, collateralPct: 60, apr: 10.2 };
  }
}
