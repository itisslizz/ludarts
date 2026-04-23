/**
 * Checkout suggestions for X01 games
 * Organized by score and number of darts remaining
 */

export interface CheckoutSuggestion {
  darts: string[]; // e.g., ["T20", "T20", "Bull"]
  score: number;
}

// 3-dart checkouts (170 down to common scores)
const threedartCheckouts: Record<number, string[]> = {
  170: ["T20", "T20", "Bull"],
  167: ["T20", "T19", "Bull"],
  164: ["T20", "T18", "Bull"],
  161: ["T20", "T17", "Bull"],
  160: ["T20", "T20", "D20"],
  158: ["T20", "T20", "D19"],
  157: ["T20", "T19", "D20"],
  156: ["T20", "T20", "D18"],
  155: ["T20", "T19", "D19"],
  154: ["T20", "T18", "D20"],
  153: ["T20", "T19", "D18"],
  152: ["T20", "T20", "D16"],
  151: ["T20", "T17", "D20"],
  150: ["T20", "T18", "D18"],
  149: ["T20", "T19", "D16"],
  148: ["T20", "T20", "D14"],
  147: ["T20", "T17", "D18"],
  146: ["T20", "T18", "D16"],
  145: ["T20", "T19", "D14"],
  144: ["T20", "T20", "D12"],
  143: ["T20", "T17", "D16"],
  142: ["T20", "T14", "D20"],
  141: ["T20", "T19", "D12"],
  140: ["T20", "T20", "D10"],
  139: ["T19", "T14", "D20"],
  138: ["T20", "T18", "D12"],
  137: ["T20", "T19", "D10"],
  136: ["T20", "T20", "D8"],
  135: ["T20", "T17", "D12"],
  134: ["T20", "T14", "D16"],
  133: ["T20", "T19", "D8"],
  132: ["T20", "T16", "D12"],
  131: ["T20", "T13", "D16"],
  130: ["T20", "T20", "D5"],
  129: ["T19", "T16", "D12"],
  128: ["T18", "T14", "D16"],
  127: ["T20", "T17", "D8"],
  126: ["T19", "T19", "D6"],
  125: ["T18", "T13", "D16"],
  124: ["T20", "T14", "D11"],
  123: ["T19", "T16", "D9"],
  122: ["T18", "T18", "D7"],
  121: ["T17", "T10", "D20"],
  120: ["T20", "20", "D20"],
  119: ["T19", "T12", "D11"],
  118: ["T20", "18", "D20"],
  117: ["T20", "17", "D20"],
  116: ["T20", "16", "D20"],
  115: ["T20", "15", "D20"],
  114: ["T20", "14", "D20"],
  113: ["T20", "13", "D20"],
  112: ["T20", "12", "D20"],
  111: ["T20", "11", "D20"],
  110: ["T20", "10", "D20"],
  109: ["T20", "9", "D20"],
  108: ["T20", "8", "D20"],
  107: ["T19", "10", "D20"],
  106: ["T20", "6", "D20"],
  105: ["T20", "5", "D20"],
  104: ["T20", "4", "D20"],
  103: ["T20", "3", "D20"],
  102: ["T20", "2", "D20"],
  101: ["T20", "1", "D20"],
  100: ["T20", "D20"],
  98: ["T20", "D19"],
  97: ["T19", "D20"],
  96: ["T20", "D18"],
  95: ["T19", "D19"],
  94: ["T18", "D20"],
  93: ["T19", "D18"],
  92: ["T20", "D16"],
  91: ["T17", "D20"],
  90: ["T18", "D18"],
  89: ["T19", "D16"],
  88: ["T16", "D20"],
  87: ["T17", "D18"],
  86: ["T18", "D16"],
  85: ["T15", "D20"],
  84: ["T20", "D12"],
  83: ["T17", "D16"],
  82: ["T14", "D20"],
  81: ["T19", "D12"],
  80: ["T20", "D10"],
  79: ["T19", "D11"],
  78: ["T18", "D12"],
  77: ["T19", "D10"],
  76: ["T20", "D8"],
  75: ["T17", "D12"],
  74: ["T14", "D16"],
  73: ["T19", "D8"],
  72: ["T16", "D12"],
  71: ["T13", "D16"],
  70: ["T18", "D8"],
  69: ["T19", "D6"],
  68: ["T20", "D4"],
  67: ["T17", "D8"],
  66: ["T10", "D18"],
  65: ["T11", "D16"],
  64: ["T16", "D8"],
  63: ["T13", "D12"],
  62: ["T10", "D16"],
  61: ["T15", "D8"],
  60: ["20", "D20"],
  59: ["19", "D20"],
  58: ["18", "D20"],
  57: ["17", "D20"],
  56: ["T16", "D4"],
  55: ["15", "D20"],
  54: ["14", "D20"],
  53: ["13", "D20"],
  52: ["12", "D20"],
  51: ["11", "D20"],
  50: ["10", "D20"],
  49: ["9", "D20"],
  48: ["8", "D20"],
  47: ["15", "D16"],
  46: ["6", "D20"],
  45: ["13", "D16"],
  44: ["12", "D16"],
  43: ["11", "D16"],
  42: ["10", "D16"],
  41: ["9", "D16"],
  40: ["D20"],
  39: ["7", "D16"],
  38: ["D19"],
  37: ["5", "D16"],
  36: ["D18"],
  34: ["D17"],
  32: ["D16"],
  30: ["D15"],
  28: ["D14"],
  26: ["D13"],
  24: ["D12"],
  22: ["D11"],
  20: ["D10"],
  18: ["D9"],
  16: ["D8"],
  14: ["D7"],
  12: ["D6"],
  10: ["D5"],
  8: ["D4"],
  6: ["D3"],
  4: ["D2"],
  2: ["D1"],
};

// 2-dart checkouts (after first dart)
const twodartCheckouts: Record<number, string[]> = {
  110: ["T20", "Bull"],
  107: ["T19", "Bull"],
  104: ["T18", "Bull"],
  101: ["T17", "Bull"],
  100: ["T20", "D20"],
  98: ["T20", "D19"],
  97: ["T19", "D20"],
  96: ["T20", "D18"],
  95: ["T19", "D19"],
  94: ["T18", "D20"],
  93: ["T19", "D18"],
  92: ["T20", "D16"],
  91: ["T17", "D20"],
  90: ["T18", "D18"],
  89: ["T19", "D16"],
  88: ["T16", "D20"],
  87: ["T17", "D18"],
  86: ["T18", "D16"],
  85: ["T15", "D20"],
  84: ["T20", "D12"],
  83: ["T17", "D16"],
  82: ["T14", "D20"],
  81: ["T19", "D12"],
  80: ["T20", "D10"],
  79: ["T19", "D11"],
  78: ["T18", "D12"],
  77: ["T19", "D10"],
  76: ["T20", "D8"],
  75: ["T17", "D12"],
  74: ["T14", "D16"],
  73: ["T19", "D8"],
  72: ["T16", "D12"],
  71: ["T13", "D16"],
  70: ["T18", "D8"],
  69: ["T19", "D6"],
  68: ["T20", "D4"],
  67: ["T17", "D8"],
  66: ["T10", "D18"],
  65: ["T11", "D16"],
  64: ["T16", "D8"],
  63: ["T13", "D12"],
  62: ["T10", "D16"],
  61: ["T15", "D8"],
  60: ["20", "D20"],
  59: ["19", "D20"],
  58: ["18", "D20"],
  57: ["17", "D20"],
  56: ["T16", "D4"],
  55: ["15", "D20"],
  54: ["14", "D20"],
  53: ["13", "D20"],
  52: ["12", "D20"],
  51: ["11", "D20"],
  50: ["10", "D20"],
  49: ["9", "D20"],
  48: ["8", "D20"],
  47: ["15", "D16"],
  46: ["6", "D20"],
  45: ["13", "D16"],
  44: ["12", "D16"],
  43: ["11", "D16"],
  42: ["10", "D16"],
  41: ["9", "D16"],
  40: ["D20"],
  39: ["7", "D16"],
  38: ["D19"],
  37: ["5", "D16"],
  36: ["D18"],
  34: ["D17"],
  32: ["D16"],
  30: ["D15"],
  28: ["D14"],
  26: ["D13"],
  24: ["D12"],
  22: ["D11"],
  20: ["D10"],
  18: ["D9"],
  16: ["D8"],
  14: ["D7"],
  12: ["D6"],
  10: ["D5"],
  8: ["D4"],
  6: ["D3"],
  4: ["D2"],
  2: ["D1"],
};

// 1-dart checkouts (doubles only)
const onedartCheckouts: Record<number, string[]> = {
  40: ["D20"],
  38: ["D19"],
  36: ["D18"],
  34: ["D17"],
  32: ["D16"],
  30: ["D15"],
  28: ["D14"],
  26: ["D13"],
  24: ["D12"],
  22: ["D11"],
  20: ["D10"],
  18: ["D9"],
  16: ["D8"],
  14: ["D7"],
  12: ["D6"],
  10: ["D5"],
  8: ["D4"],
  6: ["D3"],
  4: ["D2"],
  2: ["D1"],
  50: ["Bull"], // Bullseye finish
};

/**
 * Get checkout suggestion based on remaining score and darts in hand
 * @param score - Remaining score to checkout
 * @param dartsRemaining - Number of darts remaining in current visit (1-3)
 * @param outMode - "double" or "straight" out mode
 * @returns Checkout suggestion or null if no checkout available
 */
export function getCheckoutSuggestion(
  score: number,
  dartsRemaining: number,
  outMode: "double" | "straight"
): CheckoutSuggestion | null {
  // Straight out mode allows any finish
  if (outMode === "straight" && dartsRemaining >= 1) {
    // For straight out, suggest simple finishes
    if (score <= 60 && dartsRemaining === 1) {
      if (score === 50) return { score, darts: ["Bull"] };
      if (score <= 20) return { score, darts: [`${score}`] };
    }
    // Check double out table as fallback for straight out too
  }

  // Double out mode (standard)
  let checkout: string[] | undefined;

  if (dartsRemaining === 3) {
    checkout = threedartCheckouts[score];
  } else if (dartsRemaining === 2) {
    checkout = twodartCheckouts[score];
  } else if (dartsRemaining === 1) {
    checkout = onedartCheckouts[score];
  }

  if (checkout) {
    return { score, darts: checkout };
  }

  return null;
}

/**
 * Format a dart notation for display
 * @param dart - Dart notation (e.g., "T20", "D16", "Bull")
 * @returns Formatted string
 */
export function formatDart(dart: string): string {
  if (dart === "Bull") return "Bull";
  if (dart.startsWith("T")) return `T${dart.slice(1)}`;
  if (dart.startsWith("D")) return `D${dart.slice(1)}`;
  return dart;
}
