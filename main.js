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

};

function compile(source) {
    const lexer = new Lexer(source);
    const tokens = [];
    let token = lexer.getToken();
    tokens.push(token);

    while (token.type !== TerminalTypes.map.EOF) {
        // console.log(token != null ? token.text : null, token != null ? findKeyByValue(TokenType, token.kind) : null);
        token = lexer.getToken();
        tokens.push(token);
    }
    // console.log(token != null ? token.text : null, token != null ? findKeyByValue(TokenType, token.kind) : null);
    console.log('tokens: ', tokens);

    parse(tokens);
}

function parse(sentence) {
    const grammar = new Grammar(grammarProductions,nt_symbols.S);

    //console.log(grammar)
    for (let nt of grammar.nonTerminals) {
        console.log('FIRST(' + nt + ') = ' + (new Array(...grammar.firstSet[nt]).join(' ')))
        //console.log('FOLLOW(' + nt + ') = ' + (new Array(...grammar.followSet[nt]).join(' ')));
    }

    console.log(grammar.checkIfLL1());
    console.log('parsing table: ', grammar.parsingTable);
    const parsedTree = grammar.parse(sentence);
    console.log('tree:', parsedTree);
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