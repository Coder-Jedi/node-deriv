export const Timeframes_E = Object.freeze({
    MINUTE_1: 60,
    MINUTE_2: 120,
    MINUTE_3: 180,
    MINUTE_5: 300,
    MINUTE_10: 600,
    MINUTE_15: 900,

    DEFAULT: 60,
} as const);

export const AppEvents_E = Object.freeze({
    NEW_TICK: 'NEW_TICK',
} as const);

export const Basis_E = Object.freeze({
    STAKE: 'stake',
    PAYOUT: 'payout',

    DEFAULT: 'stake',
} as const);

export const ContractType_E = Object.freeze({
    CALLE: 'CALLE',
    PUTE: 'PUTE',

    DEFAULT: 'CALLE',
} as const);

export const DurationUnits_E = Object.freeze({
    MINUTES: 'm',

    DEFAULT: 'm',
} as const);

export const Symbols_E = Object.freeze({
    VOLATILITY_10: 'R_10',
    VOLATILITY_50: 'R_50',
    VOLATILITY_100: 'R_100',
    VOLATILITY_200: 'R_200',
    EURUSD: 'frxEURUSD',
    
    DEFAULT: 'R_10',
} as const);
