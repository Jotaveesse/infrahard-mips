//100-199 -> Formato R, 200-299 -> Formato I, 300-399 -> Formato J
const TerminalTypes = new TwoWayMap({
    EPSILON: -2,
    EOF: -1,
    NEWLINE: 0,
    REG: 1,
    COMMA: 2,
    L_PAREN: 3,
    R_PAREN: 4,
    NUMBER: 5,
    SHAMT: 6,
    OFFSET: 7,
    ADDRESS: 8,
    COLON: 9,
    LABEL: 10,
    LABEL_DECL: 11,
});

const NonterminalTypes = {
    S: 'S',
    LINE: 'LINE',
    OPT_LABEL: 'OPT_LABEL',
    OPT_INST: 'OPT_INST',
    NEXT_LINE: 'NEXT_LINE',
    INST: 'INST',
    R_FORMAT: 'R_FORMAT',
    I_FORMAT: 'I_FORMAT',
    J_FORMAT: 'J_FORMAT',
    T1: 'T1',
    T2: 'T2',
    T3: 'T3',
    T4: 'T4',
    T5: 'T5',
    T6: 'T6',
    T6_1: 'T6_1',
    T7: 'T7',
    T8: 'T8',
    T9: 'T9',
    T9_1: 'T9_1',
    T10: 'T10',
    T11: 'T11',
    RS: 'RS',
    RT: 'RT',
    RD: 'RD',
    SHAMT: 'SHAMT',
    OFFSET: 'OFFSET',
    ADDRESS: 'ADDRESS',
};

// cria os terminais e não terminais para fazer a gramatica do parser com base nos tipos existentes
const t_symbols = {};
const nt_symbols = {};

for (const token in TerminalTypes.map) {
    t_symbols[token] = new Terminal(TerminalTypes.map[token]);
}
delete t_symbols.NUMBER;

for (const nt in NonterminalTypes) {
    nt_symbols[nt] = new Nonterminal(nt);
}

const EPSILON = new SpecialSymbol(TerminalTypes.map.EPSILON);
const EOF = new SpecialSymbol(TerminalTypes.map.EOF);

const grammarProductions = [
    new Rule(nt_symbols.S, [nt_symbols.LINE]),
    new Rule(nt_symbols.LINE, [nt_symbols.OPT_LABEL, nt_symbols.OPT_INST, nt_symbols.NEXT_LINE]),

    new Rule(nt_symbols.OPT_LABEL, [t_symbols.LABEL_DECL]),
    new Rule(nt_symbols.OPT_LABEL, [EPSILON]),

    new Rule(nt_symbols.OPT_INST, [nt_symbols.INST]),
    new Rule(nt_symbols.OPT_INST, [EPSILON]),

    new Rule(nt_symbols.NEXT_LINE, [t_symbols.NEWLINE, nt_symbols.LINE]),
    new Rule(nt_symbols.NEXT_LINE, [EPSILON]),

    new Rule(nt_symbols.INST, [nt_symbols.R_FORMAT]),
    new Rule(nt_symbols.INST, [nt_symbols.I_FORMAT]),
    new Rule(nt_symbols.INST, [nt_symbols.J_FORMAT]),

    new Rule(nt_symbols.T1, [EPSILON]),
    new Rule(nt_symbols.T2, [nt_symbols.RS]),
    new Rule(nt_symbols.T3, [nt_symbols.RD]),
    new Rule(nt_symbols.T4, [nt_symbols.RS, t_symbols.COMMA, nt_symbols.RT]),
    new Rule(nt_symbols.T5, [nt_symbols.RD, t_symbols.COMMA, nt_symbols.RS, t_symbols.COMMA, nt_symbols.RT]),
    new Rule(nt_symbols.T6, [nt_symbols.ADDRESS]),
    new Rule(nt_symbols.ADDRESS, [t_symbols.ADDRESS]),
    new Rule(nt_symbols.ADDRESS, [t_symbols.LABEL]),
    new Rule(nt_symbols.T7, [nt_symbols.RT, t_symbols.COMMA, nt_symbols.OFFSET]),
    new Rule(nt_symbols.T8, [nt_symbols.RD, t_symbols.COMMA, nt_symbols.RT, t_symbols.COMMA, nt_symbols.SHAMT]),
    new Rule(nt_symbols.T9, [nt_symbols.RS, t_symbols.COMMA, nt_symbols.RT, t_symbols.COMMA, nt_symbols.T9_1]),
    new Rule(nt_symbols.T9_1, [t_symbols.LABEL]),
    new Rule(nt_symbols.T9_1, [t_symbols.OFFSET]),
    new Rule(nt_symbols.T10, [nt_symbols.RT, t_symbols.COMMA, nt_symbols.RS, t_symbols.COMMA, nt_symbols.OFFSET]),
    new Rule(nt_symbols.T11, [nt_symbols.RT, t_symbols.COMMA, nt_symbols.OFFSET, t_symbols.L_PAREN, nt_symbols.RS, t_symbols.R_PAREN]),

    new Rule(nt_symbols.RS, [t_symbols.REG]),
    new Rule(nt_symbols.RT, [t_symbols.REG]),
    new Rule(nt_symbols.RD, [t_symbols.REG]),

    new Rule(nt_symbols.SHAMT, [t_symbols.SHAMT]),
    new Rule(nt_symbols.OFFSET, [t_symbols.OFFSET]),
];

//vazio porque os codigos vao ser gerados com base nas instruções existentes
const instCodes = {}

//T1 ->
//T2 -> rs
//T3 -> rd
//T4 -> rs, rt
//T5 -> rd, rs, rt
//T6 -> address
//T7 -> rt, imediato
//T8 -> rd, rt, shamt
//T9 -> rs, rt, offset
//T10 -> rt, rs, offset
//T11 -> rt, offset(rs)
//instruções iniciais
const instTemplates = [
    new Instruction('add', '20', NonterminalTypes.R_FORMAT, NonterminalTypes.T5),
    new Instruction('and', '24', NonterminalTypes.R_FORMAT, NonterminalTypes.T5),
    new Instruction('div', '1a', NonterminalTypes.R_FORMAT, NonterminalTypes.T4),
    new Instruction('mult', '18', NonterminalTypes.R_FORMAT, NonterminalTypes.T4),
    new Instruction('jr', '8', NonterminalTypes.R_FORMAT, NonterminalTypes.T2),
    new Instruction('mfhi', '10', NonterminalTypes.R_FORMAT, NonterminalTypes.T3),
    new Instruction('mflo', '12', NonterminalTypes.R_FORMAT, NonterminalTypes.T3),
    new Instruction('sll', '0', NonterminalTypes.R_FORMAT, NonterminalTypes.T8),
    new Instruction('sllv', '4', NonterminalTypes.R_FORMAT, NonterminalTypes.T5),
    new Instruction('slt', '2a', NonterminalTypes.R_FORMAT, NonterminalTypes.T5),
    new Instruction('sra', '3', NonterminalTypes.R_FORMAT, NonterminalTypes.T8),
    new Instruction('srav', '7', NonterminalTypes.R_FORMAT, NonterminalTypes.T5),
    new Instruction('srl', '2', NonterminalTypes.R_FORMAT, NonterminalTypes.T8),
    new Instruction('sub', '22', NonterminalTypes.R_FORMAT, NonterminalTypes.T5),
    new Instruction('break', 'd', NonterminalTypes.R_FORMAT, NonterminalTypes.T1),
    new Instruction('rte', '13', NonterminalTypes.R_FORMAT, NonterminalTypes.T1),

    new Instruction('addi', '8', NonterminalTypes.I_FORMAT, NonterminalTypes.T10),
    new Instruction('addiu', '9', NonterminalTypes.I_FORMAT, NonterminalTypes.T10),
    new Instruction('beq', '4', NonterminalTypes.I_FORMAT, NonterminalTypes.T9),
    new Instruction('bne', '5', NonterminalTypes.I_FORMAT, NonterminalTypes.T9),
    new Instruction('ble', '6', NonterminalTypes.I_FORMAT, NonterminalTypes.T9),
    new Instruction('bgt', '7', NonterminalTypes.I_FORMAT, NonterminalTypes.T9),
    new Instruction('lb', '20', NonterminalTypes.I_FORMAT, NonterminalTypes.T11),
    new Instruction('lh', '21', NonterminalTypes.I_FORMAT, NonterminalTypes.T11),
    new Instruction('lui', 'f', NonterminalTypes.I_FORMAT, NonterminalTypes.T7),
    new Instruction('lw', '23', NonterminalTypes.I_FORMAT, NonterminalTypes.T11),
    new Instruction('sb', '28', NonterminalTypes.I_FORMAT, NonterminalTypes.T11),
    new Instruction('sh', '29', NonterminalTypes.I_FORMAT, NonterminalTypes.T11),
    new Instruction('slti', 'a', NonterminalTypes.I_FORMAT, NonterminalTypes.T10),
    new Instruction('sw', '2b', NonterminalTypes.I_FORMAT, NonterminalTypes.T11),

    new Instruction('j', '2', NonterminalTypes.J_FORMAT, NonterminalTypes.T6),
    new Instruction('jal', '3', NonterminalTypes.J_FORMAT, NonterminalTypes.T6),

    new Instruction('null', '3f', NonterminalTypes.R_FORMAT, NonterminalTypes.T1),

    new Instruction('xchg', '5', NonterminalTypes.R_FORMAT, NonterminalTypes.T4),
    new Instruction('sram', '1', NonterminalTypes.I_FORMAT, NonterminalTypes.T11),
];
