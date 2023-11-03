
class TwoWayMap {
    constructor(map) {
        this.map = map;
        this.revMap = {};
        for (const key in map) {
            const value = map[key];
            this.revMap[value] = key;
        }
    }
}


class Symbol {
    constructor(value) {
        this.type = value;
    }

    toString() {
        return this.type;
    }
}

class Nonterminal extends Symbol {
    constructor(name) {
        super(name);
    }
}

class Terminal extends Symbol {
    constructor(name) {
        super(name);
    }
}

class SpecialSymbol extends Symbol {
    constructor(name, type) {
        super(name, type);
    }
}

class Rule {
    constructor(nt, production) {
        this.nonterminal = nt;
        this.production = production;
    }

    toString() {
        return `${this.nonterminal} -> ${this.production.join(' ')}`;
    }
}
const errorTypes = {
    notAToken: 1,
    zeroStart: 2,
    invalidReg: 3,
    invalidKeyword: 4,
    invalidCharacter: 5,
}

class TokenError extends Error {
    constructor(errorType, startPos, endPos, var1 = null, var2 = null) {
        super();
        this.errorType = errorType;
        this.startPos = startPos;
        this.endPos = endPos;
        this.var1 = var1;
        this.var2 = var2;
        this.name = this.generateMessage();
    }

    generateMessage() {
        switch (this.errorType) {
            case errorTypes.notAToken:
                return `Token '${this.var1}' não reconhecido`;
            case errorTypes.zeroStart:
                return `Número iniciado por zero: '${this.var1}'`;
            case errorTypes.invalidReg:
                return `Registrador '${this.var1}' inválido`;
            case errorTypes.invalidKeyword:
                return `Identificador '${this.var1}' inválido`;
            case errorTypes.invalidCharacter:
                return `Caractere '${this.var1}' inválido`;
        }
    }

}

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
    //Formato R
    ADD: 100,
    AND: 101,
    DIV: 102,
    MULT: 103,
    JR: 104,
    MFHI: 105,
    MFLO: 106,
    SLL: 107,
    SLLV: 108,
    SLT: 109,
    SRA: 110,
    SRAV: 111,
    SRL: 112,
    SUB: 113,
    BREAK: 114,
    RTE: 115,
    //Formato I
    ADDI: 200,
    ADDIU: 201,
    BEQ: 202,
    BNE: 203,
    BLE: 204,
    BGT: 205,
    ADDM: 206,
    LB: 206,
    LH: 207,
    LUI: 208,
    LW: 209,
    SB: 210,
    SH: 211,
    SLTI: 212,
    SW: 213,
    //Formato J
    J: 300,
    JAL: 301,
});

const NonterminalTypes = {
    S: 'S',
    A: 'A',
    B: 'B',
    INST: 'INST',
    R_FORMAT: 'R_FORMAT',
    I_FORMAT: 'I_FORMAT',
    J_FORMAT: 'J_FORMAT',
    ADD: 'ADD',
    AND: 'AND',
    DIV: 'DIV',
    MULT: 'MULT',
    JR: 'JR',
    MFHI: 'MFHI',
    MFLO: 'MFLO',
    SLL: 'SLL',
    SLLV: 'SLLV',
    SLT: 'SLT',
    SRA: 'SRA',
    SRAV: 'SRAV',
    SRL: 'SRL',
    SUB: 'SUB',
    BREAK: 'BREAK',
    RTE: 'RTE',
    ADDI: 'ADDI',
    ADDIU: 'ADDIU',
    BEQ: 'BEQ',
    BNE: 'BNE',
    BLE: 'BLE',
    BGT: 'BGT',
    LB: 'LB',
    LH: 'LH',
    LUI: 'LUI',
    LW: 'LW',
    SB: 'SB',
    SH: 'SH',
    SLTI: 'SLTI',
    SW: 'SW',
    J: 'J',
    JAL: 'JAL',
    T1: 'T1',
    T2: 'T2',
    T3: 'T3',
    T4: 'T4',
    T5: 'T5',
    T6: 'T6',
    T7: 'T7',
    T8: 'T8',
    T9: 'T9',
    T10: 'T10',
    T11: 'T11',
    RS: 'RS',
    RT: 'RT',
    RD: 'RD',
    SHAMT: 'SHAMT',
    OFFSET: 'OFFSET',
    ADDRESS: 'ADDRESS',
};

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
    new Rule(nt_symbols.S, [nt_symbols.A]),
    new Rule(nt_symbols.A, [nt_symbols.INST, nt_symbols.B]),
    new Rule(nt_symbols.A, [t_symbols.NEWLINE, nt_symbols.A]),
    new Rule(nt_symbols.A, [EPSILON]),
    new Rule(nt_symbols.B, [t_symbols.NEWLINE, nt_symbols.A]),
    new Rule(nt_symbols.B, [EPSILON]),
    new Rule(nt_symbols.INST, [nt_symbols.R_FORMAT]),
    new Rule(nt_symbols.INST, [nt_symbols.I_FORMAT]),
    new Rule(nt_symbols.INST, [nt_symbols.J_FORMAT]),

    new Rule(nt_symbols.R_FORMAT, [nt_symbols.ADD]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.AND]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.DIV]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.MULT]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.JR]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.MFHI]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.MFLO]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.SLL]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.SLLV]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.SLT]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.SRA]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.SRAV]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.SRL]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.SUB]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.BREAK]),
    new Rule(nt_symbols.R_FORMAT, [nt_symbols.RTE]),

    new Rule(nt_symbols.I_FORMAT, [nt_symbols.ADDI]),
    new Rule(nt_symbols.I_FORMAT, [nt_symbols.ADDIU]),
    new Rule(nt_symbols.I_FORMAT, [nt_symbols.BEQ]),
    new Rule(nt_symbols.I_FORMAT, [nt_symbols.BNE]),
    new Rule(nt_symbols.I_FORMAT, [nt_symbols.BLE]),
    new Rule(nt_symbols.I_FORMAT, [nt_symbols.BGT]),
    new Rule(nt_symbols.I_FORMAT, [nt_symbols.LB]),
    new Rule(nt_symbols.I_FORMAT, [nt_symbols.LH]),
    new Rule(nt_symbols.I_FORMAT, [nt_symbols.LUI]),
    new Rule(nt_symbols.I_FORMAT, [nt_symbols.LW]),
    new Rule(nt_symbols.I_FORMAT, [nt_symbols.SB]),
    new Rule(nt_symbols.I_FORMAT, [nt_symbols.SH]),
    new Rule(nt_symbols.I_FORMAT, [nt_symbols.SLTI]),
    new Rule(nt_symbols.I_FORMAT, [nt_symbols.SW]),

    new Rule(nt_symbols.J_FORMAT, [nt_symbols.J]),
    new Rule(nt_symbols.J_FORMAT, [nt_symbols.JAL]),

    new Rule(nt_symbols.ADD, [t_symbols.ADD, nt_symbols.T5]),
    new Rule(nt_symbols.AND, [t_symbols.AND, nt_symbols.T5]),
    new Rule(nt_symbols.DIV, [t_symbols.DIV, nt_symbols.T4]),
    new Rule(nt_symbols.MULT, [t_symbols.MULT, nt_symbols.T4]),
    new Rule(nt_symbols.JR, [t_symbols.JR, nt_symbols.T2]),
    new Rule(nt_symbols.MFHI, [t_symbols.MFHI, nt_symbols.T3]),
    new Rule(nt_symbols.MFLO, [t_symbols.MFLO, nt_symbols.T3]),
    new Rule(nt_symbols.SLL, [t_symbols.SLL, nt_symbols.T8]),
    new Rule(nt_symbols.SLLV, [t_symbols.SLLV, nt_symbols.T5]),
    new Rule(nt_symbols.SLT, [t_symbols.SLT, nt_symbols.T5]),
    new Rule(nt_symbols.SRA, [t_symbols.SRA, nt_symbols.T8]),
    new Rule(nt_symbols.SRAV, [t_symbols.SRAV, nt_symbols.T5]),
    new Rule(nt_symbols.SRL, [t_symbols.SRL, nt_symbols.T8]),
    new Rule(nt_symbols.SUB, [t_symbols.SUB, nt_symbols.T5]),
    new Rule(nt_symbols.BREAK, [t_symbols.BREAK, nt_symbols.T1]),
    new Rule(nt_symbols.RTE, [t_symbols.RTE, nt_symbols.T1]),

    new Rule(nt_symbols.ADDI, [t_symbols.ADDI, nt_symbols.T10]),
    new Rule(nt_symbols.ADDIU, [t_symbols.ADDIU, nt_symbols.T10]),
    new Rule(nt_symbols.BEQ, [t_symbols.BEQ, nt_symbols.T9]),
    new Rule(nt_symbols.BNE, [t_symbols.BNE, nt_symbols.T9]),
    new Rule(nt_symbols.BLE, [t_symbols.BLE, nt_symbols.T9]),
    new Rule(nt_symbols.BGT, [t_symbols.BGT, nt_symbols.T9]),
    new Rule(nt_symbols.LB, [t_symbols.LB, nt_symbols.T11]),
    new Rule(nt_symbols.LH, [t_symbols.LH, nt_symbols.T11]),
    new Rule(nt_symbols.LUI, [t_symbols.LUI, nt_symbols.T7]),
    new Rule(nt_symbols.LW, [t_symbols.LW, nt_symbols.T11]),
    new Rule(nt_symbols.SB, [t_symbols.SB, nt_symbols.T11]),
    new Rule(nt_symbols.SH, [t_symbols.SH, nt_symbols.T11]),
    new Rule(nt_symbols.SLTI, [t_symbols.SLTI, nt_symbols.T10]),
    new Rule(nt_symbols.SW, [t_symbols.SW, nt_symbols.T11]),

    new Rule(nt_symbols.J, [t_symbols.J, nt_symbols.T6]),
    new Rule(nt_symbols.JAL, [t_symbols.JAL, nt_symbols.T6]),

    new Rule(nt_symbols.T1, [EPSILON]),
    new Rule(nt_symbols.T2, [nt_symbols.RS]),
    new Rule(nt_symbols.T3, [nt_symbols.RD]),
    new Rule(nt_symbols.T4, [nt_symbols.RS, t_symbols.COMMA, nt_symbols.RT]),
    new Rule(nt_symbols.T5, [nt_symbols.RD, t_symbols.COMMA, nt_symbols.RS, t_symbols.COMMA, nt_symbols.RT]),
    new Rule(nt_symbols.T6, [nt_symbols.ADDRESS]),
    new Rule(nt_symbols.T7, [nt_symbols.RT, t_symbols.COMMA, nt_symbols.OFFSET]),
    new Rule(nt_symbols.T8, [nt_symbols.RD, t_symbols.COMMA, nt_symbols.RT, t_symbols.COMMA, nt_symbols.SHAMT]),
    new Rule(nt_symbols.T9, [nt_symbols.RS, t_symbols.COMMA, nt_symbols.RT, t_symbols.COMMA, nt_symbols.OFFSET]),
    new Rule(nt_symbols.T10, [nt_symbols.RT, t_symbols.COMMA, nt_symbols.RS, t_symbols.COMMA, nt_symbols.OFFSET]),
    new Rule(nt_symbols.T11, [nt_symbols.RT, t_symbols.COMMA, nt_symbols.OFFSET, t_symbols.L_PAREN, nt_symbols.RS, t_symbols.R_PAREN]),

    new Rule(nt_symbols.RS, [t_symbols.REG]),
    new Rule(nt_symbols.RT, [t_symbols.REG]),
    new Rule(nt_symbols.RD, [t_symbols.REG]),

    new Rule(nt_symbols.SHAMT, [t_symbols.SHAMT]),
    new Rule(nt_symbols.OFFSET, [t_symbols.OFFSET]),
    new Rule(nt_symbols.ADDRESS, [t_symbols.ADDRESS]),
];

Set.prototype.display = function () {
    const arr = Array.from(this);
    const modArr = arr.map((elem) => { return TerminalTypes.revMap[elem.type]; });
    if (modArr.length <= 1) {
        return modArr.join(', ');
    }
    const lastElement = modArr.pop();
    return modArr.join(', ') + ' ou ' + lastElement;
};