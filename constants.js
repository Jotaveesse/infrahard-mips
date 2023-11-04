
class TwoWayMap {
    constructor(map) {
        this.map = map;
        this.revMap = {};
        this.update();
    }
    update() {
        for (const key in this.map) {
            const value = this.map[key];
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
    invalidToken: 6,
    negativeNumber: 7,
    tooManyBits: 8,
    tableError: 9,
}

class CompilingError extends Error {
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
            case errorTypes.invalidToken:
                return (`Esperava por ${this.var1} e apareceu ${this.var2}`);
            case errorTypes.negativeNumber:
                return (`Esperava por um número positivo e apareceu ${this.var1}`);
            case errorTypes.tooManyBits:
                return (`Esperava por um número de no máximo ${this.var1} bits e apareceu um de ${this.var2} bits`);
            case errorTypes.tableError:
                return (`Tem algo errado com a tabela de parsing no não-terminal ${this.var1}`);
        }
    }

}



class Instruction {
    constructor(name, code, format, suffix) {
        this.name = name.toUpperCase();
        this.code = code;
        this.format = format;
        this.suffix = suffix;
        this.productions = [];

        this.addToParser();
    }
    alreadyExists() {
        //TODO prevenir caracteres ilegais e  codigos ilegais
        let nameExists = false;

        nameExists ||= codes[this.name] !== undefined;
        nameExists ||= t_symbols[this.name] !== undefined;
        nameExists ||= nt_symbols[this.name] !== undefined;
        nameExists ||= NonterminalTypes[this.name] !== undefined;
        nameExists ||= TerminalTypes.map[this.name] !== undefined;

        if (nameExists)
            return true;

        for (let inst in codes) {
            if (codes[inst] === this.code) {
                if (this.format.type == NonterminalTypes.R_FORMAT) {
                    if (TerminalTypes.map[inst] >= 100 && TerminalTypes.map[inst] < 200)
                        return true;

                }
                else {
                    if (TerminalTypes.map[inst] >= 200 && TerminalTypes.map[inst] < 400)
                        return true;
                }
            }
        }

        return false;
    }
    removeFromParser() {
        if (!this.alreadyExists)
            return 'não existe';

        delete codes[this.name];
        delete TerminalTypes.map[this.name];
        TerminalTypes.update();
        delete t_symbols[this.name];
        delete NonterminalTypes[this.name];
        delete nt_symbols[this.name];

        for (const rule of this.productions) {
            const index = grammarProductions.indexOf(rule);
            if (index !== -1) {
                grammarProductions.splice(index, 1);
            }
        }
    }
    addToParser() {
        if (this.alreadyExists())
            return 'já existe';

        codes[this.name] = this.code;

        let start;
        if (this.format.type == NonterminalTypes.R_FORMAT)
            start = 100;
        else if (this.format.type == NonterminalTypes.I_FORMAT)
            start = 200;
        else if (this.format.type == NonterminalTypes.J_FORMAT)
            start = 300;

        for (let i = start; i < (start + 100); i++) {
            if (TerminalTypes.revMap[i] === undefined) {
                TerminalTypes.map[this.name] = i;
                TerminalTypes.update();
                break;
            }
        }


        t_symbols[this.name] = new Terminal(TerminalTypes.map[this.name]);

        NonterminalTypes[this.name] = this.name;
        nt_symbols[this.name] = new Nonterminal(NonterminalTypes[this.name]);

        this.productions = [
            new Rule(this.format, [nt_symbols[this.name]]),
            new Rule(nt_symbols[this.name], [t_symbols[this.name], this.suffix])
        ]
        grammarProductions.push(...this.productions);
    }
}

const codes = {}

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

});

const NonterminalTypes = {
    S: 'S',
    A: 'A',
    B: 'B',
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

const instructions = [
    new Instruction('add', '20', nt_symbols.R_FORMAT, nt_symbols.T5),
    new Instruction('and', '24', nt_symbols.R_FORMAT, nt_symbols.T5),
    new Instruction('div', '1a', nt_symbols.R_FORMAT, nt_symbols.T4),
    new Instruction('mult', '18', nt_symbols.R_FORMAT, nt_symbols.T4),
    new Instruction('jr', '8', nt_symbols.R_FORMAT, nt_symbols.T2),
    new Instruction('mfhi', '10', nt_symbols.R_FORMAT, nt_symbols.T3),
    new Instruction('mflo', '12', nt_symbols.R_FORMAT, nt_symbols.T3),
    new Instruction('sll', '0', nt_symbols.R_FORMAT, nt_symbols.T8),
    new Instruction('sllv', '4', nt_symbols.R_FORMAT, nt_symbols.T5),
    new Instruction('slt', '2a', nt_symbols.R_FORMAT, nt_symbols.T5),
    new Instruction('sra', '3', nt_symbols.R_FORMAT, nt_symbols.T8),
    new Instruction('srav', '7', nt_symbols.R_FORMAT, nt_symbols.T5),
    new Instruction('srl', '2', nt_symbols.R_FORMAT, nt_symbols.T8),
    new Instruction('sub', '22', nt_symbols.R_FORMAT, nt_symbols.T5),
    new Instruction('break', 'd', nt_symbols.R_FORMAT, nt_symbols.T1),
    new Instruction('rte', '13', nt_symbols.R_FORMAT, nt_symbols.T1),

    new Instruction('addi', '8', nt_symbols.I_FORMAT, nt_symbols.T10),
    new Instruction('addiu', '9', nt_symbols.I_FORMAT, nt_symbols.T10),
    new Instruction('beq', '4', nt_symbols.I_FORMAT, nt_symbols.T9),
    new Instruction('bne', '5', nt_symbols.I_FORMAT, nt_symbols.T9),
    new Instruction('ble', '6', nt_symbols.I_FORMAT, nt_symbols.T9),
    new Instruction('bgt', '7', nt_symbols.I_FORMAT, nt_symbols.T9),
    new Instruction('lb', '20', nt_symbols.I_FORMAT, nt_symbols.T11),
    new Instruction('lh', '21', nt_symbols.I_FORMAT, nt_symbols.T11),
    new Instruction('lui', 'f', nt_symbols.I_FORMAT, nt_symbols.T7),
    new Instruction('lw', '23', nt_symbols.I_FORMAT, nt_symbols.T11),
    new Instruction('sb', '28', nt_symbols.I_FORMAT, nt_symbols.T11),
    new Instruction('sh', '29', nt_symbols.I_FORMAT, nt_symbols.T11),
    new Instruction('slti', 'a', nt_symbols.I_FORMAT, nt_symbols.T10),
    new Instruction('sw', '2b', nt_symbols.I_FORMAT, nt_symbols.T11),

    new Instruction('j', '2', nt_symbols.J_FORMAT, nt_symbols.T6),
    new Instruction('jal', '3', nt_symbols.J_FORMAT, nt_symbols.T6),
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

Array.prototype.display = function () {
    if (this.length <= 1) {
        return this.join(', ');
    }
    const lastElement = this.pop();
    return this.join(', ') + ' ou ' + lastElement;
};