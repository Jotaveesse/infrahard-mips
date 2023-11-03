var inputTextArea;
var outputTextArea;
var compileButton;
var parseButton;
var inputEditor;
var outputEditor;

window.onload = function () {
    inputTextArea = document.getElementById("input-text-area");
    outputTextArea = document.getElementById("output-text-area");
    compileButton = document.getElementById("compile-button");
    parseButton = document.getElementById("parse-button");


    inputEditor = CodeMirror.fromTextArea(inputTextArea, {
        lineNumbers: true,
        mode: 'text/x-perl',
        matchBrackets: true,
    });

    inputEditor.setOption('theme', 'blackboard');

    outputEditor = CodeMirror.fromTextArea(outputTextArea, {
        lineNumbers: true,
        mode: 'text/x-perl',
        matchBrackets: true,
    });

    outputEditor.setOption('theme', 'blackboard');

    compileButton.addEventListener("click", function () {
        inputTextArea.value = inputEditor.getValue();
        compile(inputEditor.getValue());
    });

};

function compile(source) {
    const marks = inputEditor.getAllMarks();
    for (const mark of marks) {
        mark.clear();
    }

    const grammar = new Grammar(grammarProductions, nt_symbols.S);
    const parseTree = new ParseTree(this.startSymbol);

    var parseError;
    var tokenError;

    const lexer = new Lexer(source);
    const tokens = [];
    let token;

    while (true) {
        try {
            token = lexer.getToken();
            tokens.push(token);
        }
        catch (error) {
            tokenError = error;
            handleError(tokenError);
            break;
        }


        if (token == null)
            break;

        try {
            grammar.parseToken(token, parseTree);
        }
        catch (error) {
            parseError = error;
            console.log(error)
            handleError(parseError);
            break;
        }

        if (token.type === TerminalTypes.map.EOF) {
            break;
        }
    }

    console.log('tokens: ', tokens);
    console.log(grammar.parsingTable)

    var binary;
    if (!parseError && !tokenError) {
        binary = convert(parseTree.root);
        outputTextArea.value = binary;
        outputEditor.setValue(outputTextArea.value);


        const parsedTree2 = grammar.parseAll(tokens);
        const binary2 = convert(parsedTree2.root);

        console.log(binary === binary2)
        //parse(tokens);
    }
}

function handleError(error) {
    outputTextArea.value = `Linha ${error.startPos.line + 1}, coluna ${error.startPos.ch + 1}\n${error.name}`;
    outputEditor.setValue(outputTextArea.value);


    inputEditor.markText(error.startPos, error.endPos, {
        className: 'highlighted',
    });
}

function parse(tokens) {
    const grammar = new Grammar(grammarProductions, nt_symbols.S);

    for (let nt of grammar.nonTerminals) {
        console.log('FIRST(' + nt + ') = ' + (new Array(...grammar.firstSet[nt]).join(' ')))
        console.log('FOLLOW(' + nt + ') = ' + (new Array(...grammar.followSet[nt]).join(' ')));
    }

    console.log('parsing table: ', grammar.parsingTable);
    const parsedTree = grammar.parse(tokens);
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