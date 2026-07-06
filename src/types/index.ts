export type ReportType = 'Arrival' | 'Dispatch';

export const DEFAULT_ARRIVAL_PRODUCTS = ['RC EP', 'RC CHERRY', 'AC CHERRY'];
export const WEIGHERS = ['Keloth', 'Adhya', 'Se', 'Manual'];

export interface TransactionData {
  id?: string;
  type: 'arrival' | 'dispatch';
  date: string;
  party_name: string;
  vehicle_number: string;
  weigher: string;
  weighment_slip_number: string;
  product_name: string;
  gross_weight: number;
  bags: number;
  bag_weight: number;
  total_weight: number;     // calculated: gross_weight - (bags * bag_weight)
  deduction: number;
  net_weight: number;       // calculated: total_weight - deduction
  outturn: number;
  moisture: number;
  end_product: number;      // if outturn < 50: (net_weight / 50 * outturn) else (net_weight * outturn / 100)
  serial_number?: number;
  created_at?: string;
  updated_at?: string;
}

/** Calculate total_weight: gross_weight minus tare weight of bags */
export const calcTotalWeight = (grossWeight: number, bags: number, bagWeight: number): number => {
  return Math.max(0, grossWeight - (bags * bagWeight));
};

/** Calculate net_weight: total_weight minus deduction */
export const calcNetWeight = (totalWeight: number, deduction: number): number => {
  return Math.max(0, totalWeight - deduction);
};

/** Calculate end_product (EP):
 *  if outturn < 50 → net_weight / 50 * outturn
 *  else → net_weight * outturn / 100
 */
export const calcEndProduct = (netWeight: number, outturn: number): number => {
  if (outturn <= 0) return 0;
  if (outturn < 50) {
    return (netWeight / 50) * outturn;
  }
  return (netWeight * outturn) / 100;
};
