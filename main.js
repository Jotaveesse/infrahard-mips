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
    const R = new Nonterminal('R');
    const I = new Nonterminal('I');
    const J = new Nonterminal('J');

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

    const JUMP = new Nonterminal('JUMP');
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

    const terminals = {};

    for (const token in TokenType.map) {
        terminals[token] = new Terminal(TokenType.map[token]);
    }

    const grammarProductions = [
        new Rule(S, [A]),
        new Rule(A, [INST, B]),
        new Rule(A, [terminals.NEWLINE, A]),
        new Rule(A, [EPSILON]),
        new Rule(B, [terminals.NEWLINE, A]),
        new Rule(B, [EPSILON]),
        new Rule(INST, [R]),
        new Rule(INST, [I]),
        new Rule(INST, [J]),

        new Rule(R, [ADD]),
        new Rule(R, [AND]),
        new Rule(R, [DIV]),
        new Rule(R, [MULT]),
        new Rule(R, [JR]),
        new Rule(R, [MFHI]),
        new Rule(R, [MFLO]),
        new Rule(R, [SLL]),
        new Rule(R, [SLLV]),
        new Rule(R, [SLT]),
        new Rule(R, [SRA]),
        new Rule(R, [SRAV]),
        new Rule(R, [SRL]),
        new Rule(R, [SUB]),
        new Rule(R, [BREAK]),
        new Rule(R, [RTE]),

        new Rule(I, [ADDI]),
        new Rule(I, [ADDIU]),
        new Rule(I, [BEQ]),
        new Rule(I, [BNE]),
        new Rule(I, [BLE]),
        new Rule(I, [BGT]),
        new Rule(I, [LB]),
        new Rule(I, [LH]),
        new Rule(I, [LUI]),
        new Rule(I, [LW]),
        new Rule(I, [SB]),
        new Rule(I, [SH]),
        new Rule(I, [SLTI]),
        new Rule(I, [SW]),
        
        new Rule(J, [JUMP]),
        new Rule(J, [JAL]),


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

        new Rule(JUMP, [terminals.J, T6]),
        new Rule(JAL, [terminals.JAL, T6]),



        new Rule(T1, [EPSILON]),
        new Rule(T2, [RS]),
        new Rule(T3, [RD]),
        new Rule(T4, [RS, terminals.COMMA, RT]),
        new Rule(T5, [RD, terminals.COMMA, RS, terminals.COMMA, RT]),
        new Rule(T6, [terminals.NUMBER]),
        new Rule(T7, [RT, terminals.COMMA, terminals.NUMBER]),
        new Rule(T8, [RD, terminals.COMMA, RT, terminals.COMMA, terminals.NUMBER]),
        new Rule(T9, [RS, terminals.COMMA, RT, terminals.COMMA, terminals.NUMBER]),
        new Rule(T10, [RT, terminals.COMMA, RS, terminals.COMMA, terminals.NUMBER]),
        new Rule(T11, [RT, terminals.COMMA, terminals.NUMBER, terminals.L_PAREN, RS, terminals.R_PAREN]),

        new Rule(RS, [terminals.REG]),
        new Rule(RT, [terminals.REG]),
        new Rule(RD, [terminals.REG]),


        //new Rule(ADD, [terminals.ADD, terminals.REG, terminals.COMMA, terminals.REG, terminals.COMMA, terminals.REG]),
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
    console.log(parsedTree);
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