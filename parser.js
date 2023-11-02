
class TwoWayMap {
    constructor(map) {
        this.map = map;
        this.revMap = {};
        for (const key in map) {
            const value = map[key];
            this.revMap[value] = key;
        }
    }
    //get(key) { return this.map[key]; }
    //revGet(key) { return this.reverseMap[key]; }
}
const TokenType = new TwoWayMap({
    EPSILON: -2,
    EOF: -1,
    NEWLINE: 0,
    NUMBER: 1,
    IDENT: 2,
    COMMA: 3,
    REG: 4,
    COLON: 5,
    L_PAREN: 6,
    R_PAREN: 7,
    //RS:8,
    //RT:9,
    //RD:10,
    SHAMT: 11,
    OFFSET: 12,
    ADDRESS: 13,
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



class SymbolType {
    static TERMINAL = 0;
    static NONTERMINAL = 1;
    static EPSILON = 2;
    static EOF = 3;
}

class Symbol {
    constructor(value, type) {
        this.name = value;
        //this.text = value.text;
        //this.kind= value.kind;
        this.type = type;
    }

    toString() {
        return this.name;
    }
}

class Nonterminal extends Symbol {
    constructor(name) {
        super(name, SymbolType.NONTERMINAL);
    }
}

class Terminal extends Symbol {
    constructor(name) {
        super(name, SymbolType.TERMINAL);
    }
}

class SpecialSymbol extends Symbol {
    constructor(name, type) {
        if (type === SymbolType.EPSILON || type === SymbolType.EOF) {
            super(name, type);
        } else {
            throw new Error('Tipo inválido');
        }
    }
}

const EPSILON = new SpecialSymbol(TokenType.map.EPSILON, SymbolType.EPSILON);
const EOF = new SpecialSymbol(TokenType.map.EOF, SymbolType.EOF);

class Rule {
    constructor(nt, production) {
        this.nonterminal = nt;
        this.production = production;
    }

    toString() {
        return `${this.nonterminal} -> ${this.production.join(' ')}`;
    }
}

class Grammar {
    constructor(productions, startSymbol) {
        this.productions = productions;
        this.startSymbol = startSymbol;
        this.nonTerminals = new Set();
        this.terminals = new Set();

        for (const p of productions) {
            this.nonTerminals.add(p.nonterminal);
            for (const s of p.production) {
                if (s instanceof Terminal) {
                    this.terminals.add(s);
                }
            }
        }

        this.firstSet = {};
        this.followSet = {};
        this.parsingTable = {};

        this.buildFirstSets();
        this.buildFollowSets();
        this.generateParsingTable();
    }

    buildFirstSets() {
        for (const t of this.terminals) {
            //console.log(TokenType.revMap[t.name])
            this.firstSet[t] = new Set([t]);
        }

        for (const nt of this.nonTerminals) {
            this.firstSet[nt] = new Set();
        }
        this.firstSet[EOF] = new Set([EOF]);
        this.firstSet[EPSILON] = new Set([EPSILON]);

        let prevFollowSet = {};


        while (!areObjectSetsEqual(prevFollowSet, this.firstSet)) {
            prevFollowSet = structuredClone(this.firstSet);

            //para cada produção
            for (const rule of this.productions) {
                //para cada simbolo da produção
                for (let i = 0; i < rule.production.length; i++) {
                    const symbol = rule.production[i];
                    const symbolFirst = new Set(this.firstSet[symbol]);

                    //caso o first nao tenha epsilon já pode acabar aqui
                    //caso contrario continua adicionando os firsts dos proximos simbolos
                    if (!symbolFirst.has(EPSILON)) {
                        this.firstSet[rule.nonterminal] = new Set([...this.firstSet[rule.nonterminal], ...symbolFirst]);
                        break;
                    }
                    else if (i < rule.production.length - 1) {
                        symbolFirst.delete(EPSILON);
                        this.firstSet[rule.nonterminal] = new Set([...this.firstSet[rule.nonterminal], ...symbolFirst]);
                    }
                    else {
                        this.firstSet[rule.nonterminal] = new Set([...this.firstSet[rule.nonterminal], ...symbolFirst]);
                    }
                }
            }

            // console.log("prev", prevFollowSet)
            // console.log('current', this.firstSet)
        }
    }

    buildFollowSets() {
        // inicializa os follows
        for (const nt of this.nonTerminals) {
            this.followSet[nt] = new Set();
        }

        this.followSet[this.startSymbol].add(EOF);

        let prevFollowSet = {};

        while (!areObjectSetsEqual(prevFollowSet, this.followSet)) {
            prevFollowSet = structuredClone(this.followSet);

            //para cada produção
            for (const rule of this.productions) {
                //para cada simbolo da produção
                for (let i = 0; i < rule.production.length; i++) {
                    const symbol = rule.production[i];

                    if (symbol instanceof Nonterminal) {
                        this.followSet[symbol] = new Set([...this.followSet[symbol], ...this.getSymbolFollows(rule, i)]);
                    }
                }
            }
        }

    }

    getSymbolFollows(rule, currIndex) {
        const symbol = rule.production[currIndex];

        if (symbol instanceof Nonterminal) {
            let follows;

            //se esse não for o ultimo simbolo
            if (currIndex < rule.production.length - 1) {
                follows = new Set(this.firstSet[rule.production[currIndex + 1]]);   //pega firsts to proximo simbolo
            }
            //se for ultimo simbolo
            else {
                follows = new Set(this.followSet[rule.nonterminal]);    //pega follow do simbolo da regra
            }

            //caso o proximo simbolo tenha epsilon
            if (follows.has(EPSILON)) {
                follows.delete(EPSILON);

                const nextFirst = this.getSymbolFollows(rule, currIndex + 1);  //pega follow do proximo simbolo

                follows = new Set([...nextFirst, ...follows]);
            }

            return follows;
        }
    }
    generateParsingTable() {
        for (const nt of this.nonTerminals) {
            this.parsingTable[nt] = {};
            for (const t of this.terminals) {
                this.parsingTable[nt][t.name] = [];
            }

            this.parsingTable[nt][TokenType.map.EOF] = [];
        }

        for (const prod of this.productions) {
            const prodFirstSet = {};
            for (const t of this.terminals) {
                prodFirstSet[t.name] = new Set([t]);
            }

            for (const nt of this.nonTerminals) {
                prodFirstSet[nt] = new Set();
            }
            //console.log(prod)
            for (const firstTerminal of this.firstSet[prod.production[0]]) {
                if (prod.production[0] === EPSILON) {
                    //talvez esteja errado pq deveria pegar o follow do proximo simbolo
                    for (const followTerminal of this.followSet[prod.nonterminal]) {
                        console.log(prod.nonterminal, followTerminal, prod.production)
                        //console.log('table: ', this.parsingTable)
                        this.parsingTable[prod.nonterminal.name][followTerminal.name].push(prod.production);
                    }
                } else if (firstTerminal === EPSILON) {
                    //console.log('huh', this.firstSet, prod.production)
                    if (prod.production.length >= 2) {
                        for (const firstTerminal of this.firstSet[prod.production[1]]) {
                            console.log(prod.nonterminal, firstTerminal, prod.production)
                            this.parsingTable[prod.nonterminal.name][firstTerminal.name].push(prod.production);
                        }
                    }
                    else {
                        for (const followTerminal of this.followSet[prod.nonterminal]) {
                            console.log(prod.nonterminal, followTerminal, prod.production)
                            //console.log('table: ', this.parsingTable)
                            this.parsingTable[prod.nonterminal.name][followTerminal.name].push(prod.production);
                        }
                    }
                } else {
                    //console.log(prod.nonterminal, firstTerminal, prod.production)
                    this.parsingTable[prod.nonterminal.name][firstTerminal.name].push(prod.production);
                }
            }
        }
    }

    checkIfLL1() {
        for (const nt of this.nonTerminals) {
            for (const t of this.terminals) {
                if (this.parsingTable[nt][t.name].length > 1) {
                    console.log('Erro na tabela: ', nt, t.name);
                    return false;
                }
            }
        }
        return true;
    }

    parse(sentence) {
        if (!this.checkIfLL1()) {
            console.log('Erro, gramática não é LL(1)!');
            return null;
        } else {

            const size = sentence.length;
            let i = 0;
            const stack = [EOF, this.startSymbol];
            let currToken = sentence[i];
            let stackTop = stack[stack.length - 1];

            const parseTree = new ParseTree(this.startSymbol);

            while (stackTop !== EOF) {
                //console.log(sentence)

                //console.log(stackTop, currToken, TokenType.revMap[currToken.kind]);
                if (currToken.kind === TokenType.map.NUMBER) {
                    if (stackTop.name == ('OFFSET'))
                        currToken.kind = TokenType.map.OFFSET;
                    else if (stackTop.name == ('SHAMT'))
                        currToken.kind = TokenType.map.SHAMT;
                    else if (stackTop.name == ('ADDRESS') || stackTop.name == ('T6'))
                        currToken.kind = TokenType.map.ADDRESS;

                }

                if (stackTop instanceof Terminal) {
                    if (currToken.kind === TokenType.map.SHAMT || currToken.kind === TokenType.map.OFFSET || currToken.kind === TokenType.map.ADDRESS) {
                        stack.pop();
                        i++;
                        console.log(currToken)

                        const bitCount = countBits(currToken.text);
                        let bitLimit;
                        if (currToken.kind === TokenType.map.SHAMT) {
                            if (currToken.text < 0) {
                                console.log(`Erro sintático, esperava por um número positivo e apareceu  um de negativo na posição ${i}`);
                                return null;
                            }
                            bitLimit = 6;   //6 pq so aceita os numeros positivos
                        }
                        if (currToken.kind === TokenType.map.OFFSET) {
                            bitLimit = 16;
                        }
                        if (currToken.kind === TokenType.map.ADDRESS) {
                            bitLimit = 26;
                        }
                        if (bitCount > bitLimit) {
                            console.log(currToken.text)
                            console.log(`Erro sintático, esperava por um número de ${bitLimit} bits e apareceu  um de ${bitCount} bits na posição ${i}`);
                            return null;
                        }

                        //adiciona o valor do token na arvore
                        parseTree.root.findRightmostEmptyTerminal().value = currToken.text;

                        if (i < size) {
                            currToken = sentence[i];
                        } else {
                            currToken = TokenType.map.EOF;
                        }

                    }
                    else if (stackTop.name === currToken.kind) {
                        // remove ultimo elemento da pilha e vai pro proximo token
                        stack.pop();
                        i++;

                        //console.log(parseTree.root.findRightmostEmptyTerminal());

                        //adiciona o valor do token na arvore
                        parseTree.root.findRightmostEmptyTerminal().value = currToken.text;

                        if (i < size) {
                            currToken = sentence[i];
                        } else {
                            currToken = TokenType.map.EOF;
                        }

                    } else {
                        console.log(`Erro sintático, esperava por ${TokenType.revMap[stackTop.name]} e apareceu ${TokenType.revMap[currToken.kind]} na posição ${i}`);
                        return null;
                    }
                }

                else if (stackTop instanceof Nonterminal) {
                    //caso nao tenha nenhuma regra para essa combinação de terminal e nao terminal
                    if (this.parsingTable[stackTop][currToken.kind].length === 0) {
                        console.log(`Erro sintático, caractere inesperado para resolver não-terminal ${stackTop.name}: ${TokenType.revMap[currToken.kind]} na posição ${i}`);
                        return null;
                    }
                    else if (this.parsingTable[stackTop][currToken.kind].length === 1) {
                        //remove ultimo elemento da pilha e substitui com os simbolos da regra
                        stack.pop();

                        const rightMostNode = parseTree.root.findRightmostEmptyNonterminal();

                        for (const s of [...this.parsingTable[stackTop][currToken.kind][0]].reverse()) {
                            if (s !== EPSILON) {
                                stack.push(s);
                                if (rightMostNode != null) {
                                    //console.log(rightMostNode.symbol, s, currToken);

                                    // adiciona simbolo à arvore
                                    if (s instanceof Nonterminal) {
                                        const node = new NonterminalNode(s);
                                        rightMostNode.addNonterminal(node);
                                    }
                                    else if (s instanceof Terminal) {
                                        const node = new TerminalNode(s);
                                        rightMostNode.addTerminal(node);
                                    }
                                }
                                else {
                                    console.log('Algo de errado na árvore sintática');
                                    return null;
                                }
                            }
                            //caso regra seja epsilon adiciona o no epsilon terminal
                            else {
                                if (rightMostNode != null) {
                                    const node = new TerminalNode(s);
                                    rightMostNode.addTerminal(node);
                                }
                            }
                        }
                    }
                }
                else {
                    console.log('Tem algo errado com a tabela de parsing.');
                    return null;
                }
                stackTop = stack[stack.length - 1];
            }

            if (currToken.kind === TokenType.map.EOF) {
                return parseTree;
            } else {
                //console.log(sentence)
                //console.log(currToken);
                console.log(`Erro sintático, esperava por EOF e apareceu: ${TokenType.revMap[currToken.kind]} na posição ${i}`);
                return null;
            }
        }
    }


}
function areObjectSetsEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Check if the keys in both objects are the same
    if (!keys1.every(key => keys2.includes(key))) {
        return false;
    }

    if (!keys2.every(key => keys1.includes(key))) {
        return false;
    }

    // Check if the sets in each key are equal
    for (const key of keys1) {
        const set1 = obj1[key];
        const set2 = obj2[key];

        if (!(set1 instanceof Set) || !(set2 instanceof Set)) {
            return false; // Ensure values are sets
        }

        if (set1.size !== set2.size) {
            return false; // Different sizes
        }

        for (const value1 of set1) {
            let hasVal = false;
            for (const value2 of set2) {

                hasVal = areObjectsEqual(value1, value2);
                if (hasVal)
                    break;
            }

            if (!hasVal)
                return false
        }
    }
    return true; // All checks passed
}

function areObjectsEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false; // Different number of keys
    }

    for (const key of keys1) {
        if (obj1[key] !== obj2[key]) {
            return false; // Values for the same key are not equal
        }
    }

    return true; // All keys and values are equal
}

function countBits(num) {
    const intNum = parseInt(num);
    if (intNum >= 0)
        return Math.ceil(Math.log(intNum + 1) / Math.log(2)) + 1;
    else
        return Math.ceil(Math.log(Math.abs(intNum)) / Math.log(2)) + 1;

}