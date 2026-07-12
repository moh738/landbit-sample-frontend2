export interface GraphDataPoint {
  date: string;
  amount: number;
  /** Current portfolio value (normalized from API) */
  currentValuation?: number;
  /** Invested amount (normalized from API) */
  newValuation?: number;
}
export interface GraphStats {
  totalAmount: number;
  fractionalAmount: number;
  fullAmount: number;
}
export interface GraphData {
  graphData: GraphDataPoint[];
  stats: GraphStats;
}

/** Query `filter` values for `GET /dashboard/user/graph` */
export type GraphFilter = '1 Week' | '1 Month' | '1 year';
