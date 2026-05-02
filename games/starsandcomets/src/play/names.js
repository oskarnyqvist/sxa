// Pools for default body names. Duplicates are fine — the user can rename.

const STAR_NAMES = [
    'Sirius', 'Vega', 'Altair', 'Polaris', 'Rigel', 'Antares', 'Procyon',
    'Capella', 'Arcturus', 'Spica', 'Bellatrix', 'Mira', 'Atlas', 'Aldebaran',
    'Betelgeuse', 'Castor', 'Pollux', 'Deneb', 'Fomalhaut', 'Regulus',
    'Alphard', 'Hadar', 'Achernar', 'Acrux', 'Mimosa',
];

const COMET_NAMES = [
    'Halley', 'Encke', 'Wirtanen', 'Borisov', 'Tempel', 'Wild', 'Hyakutake',
    'Hartley', 'Lovejoy', 'McNaught', 'Holmes', 'Schwassmann', 'Giacobini',
    'Tuttle', 'Faye', 'Brorsen', 'Pons', 'Biela', 'Donati', 'Ikeya',
];

export function randomStarName() {
    return STAR_NAMES[Math.floor(Math.random() * STAR_NAMES.length)];
}

export function randomCometName() {
    return COMET_NAMES[Math.floor(Math.random() * COMET_NAMES.length)];
}
