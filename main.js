var inputTextArea;
var outputTextArea;
var compileButton;
var parseButton;

window.onload = function () {
    inputTextArea = document.getElementById("input-text-area");
    outputTextArea = document.getElementById("output-text-area");
    compileButton = document.getElementById("compile-button");
    parseButton = document.getElementById("parse-button");

    compileButton.addEventListener("click", function () {
        compile(inputTextArea.value);
    });

    parseButton.addEventListener("click", function () {
        parse(inputTextArea.value);
    });
};

function compile(source) {
    const lexer = new Lexer(source);
    const tokens = [];
    let token = lexer.getToken();
    tokens.push(token);

    while (token.kind !== TokenType.map.EOF) {
        // console.log(token != null ? token.text : null, token != null ? findKeyByValue(TokenType, token.kind) : null);
        token = lexer.getToken();
        tokens.push(token);
    }
    // console.log(token != null ? token.text : null, token != null ? findKeyByValue(TokenType, token.kind) : null);
    console.log('tokens: ', tokens);

    parse(tokens);
}

function parse(sentence) {
    const S = new Nonterminal('S');
    const A = new Nonterminal('A');
    const B = new Nonterminal('B');
    const INST = new Nonterminal('INST');
    const R_FORMAT = new Nonterminal('R_FORMAT');
    const I_FORMAT = new Nonterminal('I_FORMAT');
    const J_FORMAT = new Nonterminal('J_FORMAT');

    const ADD = new Nonterminal('ADD');
    const AND = new Nonterminal('AND');
    const DIV = new Nonterminal('DIV');
    const MULT = new Nonterminal('MULT');
    const JR = new Nonterminal('JR');
    const MFHI = new Nonterminal('MFHI');
    const MFLO = new Nonterminal('MFLO');
    const SLL = new Nonterminal('SLL');
    const SLLV = new Nonterminal('SLLV');
    const SLT = new Nonterminal('SLT');
    const SRA = new Nonterminal('SRA');
    const SRAV = new Nonterminal('SRAV');
    const SRL = new Nonterminal('SRL');
    const SUB = new Nonterminal('SUB');
    const BREAK = new Nonterminal('BREAK');
    const RTE = new Nonterminal('RTE');

    const ADDI = new Nonterminal('ADDI');
    const ADDIU = new Nonterminal('ADDIU');
    const BEQ = new Nonterminal('BEQ');
    const BNE = new Nonterminal('BNE');
    const BLE = new Nonterminal('BLE');
    const BGT = new Nonterminal('BGT');
    const LB = new Nonterminal('LB');
    const LH = new Nonterminal('LH');
    const LUI = new Nonterminal('LUI');
    const LW = new Nonterminal('LW');
    const SB = new Nonterminal('SB');
    const SH = new Nonterminal('SH');
    const SLTI = new Nonterminal('SLTI');
    const SW = new Nonterminal('SW');

    const J = new Nonterminal('J');
    const JAL = new Nonterminal('JAL');

    const T1 = new Nonterminal('T1');
    const T2 = new Nonterminal('T2');
    const T3 = new Nonterminal('T3');
    const T4 = new Nonterminal('T4');
    const T5 = new Nonterminal('T5');
    const T6 = new Nonterminal('T6');
    const T7 = new Nonterminal('T7');
    const T8 = new Nonterminal('T8');
    const T9 = new Nonterminal('T9');
    const T10 = new Nonterminal('T10');
    const T11 = new Nonterminal('T11');

    const RS = new Nonterminal('RS');
    const RT = new Nonterminal('RT');
    const RD = new Nonterminal('RD');

    const SHAMT = new Nonterminal('SHAMT');
    const OFFSET = new Nonterminal('OFFSET');
    const ADDRESS = new Nonterminal('ADDRESS');

    const terminals = {};

    for (const token in TokenType.map) {
        terminals[token] = new Terminal(TokenType.map[token]);
    }
    delete terminals.NUMBER;

    const grammarProductions = [
        new Rule(S, [A]),
        new Rule(A, [INST, B]),
        new Rule(A, [terminals.NEWLINE, A]),
        new Rule(A, [EPSILON]),
        new Rule(B, [terminals.NEWLINE, A]),
        new Rule(B, [EPSILON]),
        new Rule(INST, [R_FORMAT]),
        new Rule(INST, [I_FORMAT]),
        new Rule(INST, [J_FORMAT]),

        new Rule(R_FORMAT, [ADD]),
        new Rule(R_FORMAT, [AND]),
        new Rule(R_FORMAT, [DIV]),
        new Rule(R_FORMAT, [MULT]),
        new Rule(R_FORMAT, [JR]),
        new Rule(R_FORMAT, [MFHI]),
        new Rule(R_FORMAT, [MFLO]),
        new Rule(R_FORMAT, [SLL]),
        new Rule(R_FORMAT, [SLLV]),
        new Rule(R_FORMAT, [SLT]),
        new Rule(R_FORMAT, [SRA]),
        new Rule(R_FORMAT, [SRAV]),
        new Rule(R_FORMAT, [SRL]),
        new Rule(R_FORMAT, [SUB]),
        new Rule(R_FORMAT, [BREAK]),
        new Rule(R_FORMAT, [RTE]),

        new Rule(I_FORMAT, [ADDI]),
        new Rule(I_FORMAT, [ADDIU]),
        new Rule(I_FORMAT, [BEQ]),
        new Rule(I_FORMAT, [BNE]),
        new Rule(I_FORMAT, [BLE]),
        new Rule(I_FORMAT, [BGT]),
        new Rule(I_FORMAT, [LB]),
        new Rule(I_FORMAT, [LH]),
        new Rule(I_FORMAT, [LUI]),
        new Rule(I_FORMAT, [LW]),
        new Rule(I_FORMAT, [SB]),
        new Rule(I_FORMAT, [SH]),
        new Rule(I_FORMAT, [SLTI]),
        new Rule(I_FORMAT, [SW]),
        
        new Rule(J_FORMAT, [J]),
        new Rule(J_FORMAT, [JAL]),


        new Rule(ADD, [terminals.ADD, T5]),
        new Rule(AND, [terminals.AND, T5]),
        new Rule(DIV, [terminals.DIV, T4]),
        new Rule(MULT, [terminals.MULT, T4]),
        new Rule(JR, [terminals.JR, T2]),
        new Rule(MFHI, [terminals.MFHI, T3]),
        new Rule(MFLO, [terminals.MFLO, T3]),
        new Rule(SLL, [terminals.SLL, T8]),
        new Rule(SLLV, [terminals.SLLV, T5]),
        new Rule(SLT, [terminals.SLT, T5]),
        new Rule(SRA, [terminals.SRA, T8]),
        new Rule(SRAV, [terminals.SRAV, T5]),
        new Rule(SRL, [terminals.SRL, T8]),
        new Rule(SUB, [terminals.SUB, T5]),
        new Rule(BREAK, [terminals.BREAK, T1]),
        new Rule(RTE, [terminals.RTE, T1]),

        new Rule(ADDI, [terminals.ADDI, T10]),
        new Rule(ADDIU, [terminals.ADDIU, T10]),
        new Rule(BEQ, [terminals.BEQ, T9]),
        new Rule(BNE, [terminals.BNE, T9]),
        new Rule(BLE, [terminals.BLE, T9]),
        new Rule(BGT, [terminals.BGT, T9]),
        new Rule(LB, [terminals.LB, T11]),
        new Rule(LH, [terminals.LH, T11]),
        new Rule(LUI, [terminals.LUI, T7]),
        new Rule(LW, [terminals.LW, T11]),
        new Rule(SB, [terminals.SB, T11]),
        new Rule(SH, [terminals.SH, T11]),
        new Rule(SLTI, [terminals.SLTI, T10]),
        new Rule(SW, [terminals.SW, T11]),

        new Rule(J, [terminals.J, T6]),
        new Rule(JAL, [terminals.JAL, T6]),



        new Rule(T1, [EPSILON]),
        new Rule(T2, [RS]),
        new Rule(T3, [RD]),
        new Rule(T4, [RS, terminals.COMMA, RT]),
        new Rule(T5, [RD, terminals.COMMA, RS, terminals.COMMA, RT]),
        new Rule(T6, [ADDRESS]),
        new Rule(T7, [RT, terminals.COMMA, OFFSET]),
        new Rule(T8, [RD, terminals.COMMA, RT, terminals.COMMA, SHAMT]),
        new Rule(T9, [RS, terminals.COMMA, RT, terminals.COMMA, OFFSET]),
        new Rule(T10, [RT, terminals.COMMA, RS, terminals.COMMA, OFFSET]),
        new Rule(T11, [RT, terminals.COMMA, OFFSET, terminals.L_PAREN, RS, terminals.R_PAREN]),

        new Rule(RS, [terminals.REG]),
        new Rule(RT, [terminals.REG]),
        new Rule(RD, [terminals.REG]),

        new Rule(SHAMT, [terminals.SHAMT]),
        new Rule(OFFSET, [terminals.OFFSET]),
        new Rule(ADDRESS, [terminals.ADDRESS]),

    ];


    const grammar = new Grammar(grammarProductions, S);

    //console.log(grammar)
    for (let nt of grammar.nonTerminals) {
        console.log('FIRST(' + nt + ') = ' + (new Array(...grammar.firstSet[nt]).join(' ')))
        console.log('FOLLOW(' + nt + ') = ' + (new Array(...grammar.followSet[nt]).join(' ')));
    }

    console.log(grammar.checkIfLL1());
    console.log('parsing table: ', grammar.parsingTable);
    const parsedTree = grammar.parse(sentence);
    console.log('tree:',parsedTree);
    const binary = convert(parsedTree.root);
    outputTextArea.value = binary;

}

function findKeyByValue(object, value) {
    for (const key in object) {
        if (object[key] === value) {
            return key;
        }
    }
    return null;
}