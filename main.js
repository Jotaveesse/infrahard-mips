var inputTextArea;
var outputTextArea;
var compileButton;
var parseButton;
var inputEditor;
var outputEditor;
var instructionTemplate;
var instructionList;
var addInstructionButton;
var downloadButton;

window.onload = function () {
    inputTextArea = document.getElementById("input-text-area");
    outputTextArea = document.getElementById("output-text-area");
    compileButton = document.getElementById("compile-button");
    parseButton = document.getElementById("parse-button");
    instructionList = document.getElementById("instruction-list");
    instructionTemplate = document.getElementById("instruction-item-template");
    addInstructionButton = document.getElementById("add-instruction");
    downloadButton = document.getElementById("download-button");

    //cria os editores do CodeMirror
    inputEditor = CodeMirror.fromTextArea(inputTextArea, {
        lineNumbers: true,
        firstLineNumber: 0,
    });

    inputEditor.setOption('theme', 'blackboard');
    inputEditor.setOption('placeholder', 'Insira seu código aqui...');

    outputEditor = CodeMirror.fromTextArea(outputTextArea, {
        mode: '',
        lineNumbers: true,
        firstLineNumber: 0,
        lineWrapping: true,
        readOnly: true,
    });

    outputEditor.setOption('theme', 'blackboard');
    outputEditor.setOption('placeholder', 'Arquivo .mif sai aqui...');

    //EVENTOS
    compileButton.addEventListener("click", function () {
        compile(inputEditor.getValue());
    });

    addInstructionButton.addEventListener("click", function () {
        try {
            const newInst = new Instruction('', '', NonterminalTypes.R_FORMAT, NonterminalTypes.T1);
            instTemplates.push(newInst);
            addToInstructionList(newInst);

            instructionList.scrollTop = instructionList.scrollHeight;
        }
        catch (error) {

        }
    });

    downloadButton.addEventListener("click", function () {
        downloadTextFile(outputEditor.getValue(), 'instrucoes.mif')
    });

    inputEditor.on("change", function () {
        //atualizar a textarea permite que o texto permaneça caso atualize a pagina
        inputTextArea.value = inputEditor.getValue();

        clearHighlights();
    });


    //adiciona as instruções padrão ao parser e a lista
    for (let inst of instTemplates) {
        addToInstructionList(inst);
        inst.addToParser();
    }

};

var grammar;
var firstCompile = true;

function compile(source) {
    const startTime = new Date();

    let noChanges = true;

    //atualiza todas as instruções da lista
    for (let elem of instructionList.children) {
        const updateResult = elem.update();
        //se algum falhar em ser atualizada nao tenta compilar
        if (updateResult === false) {
            return false;
        }
        else if (updateResult === true) {
            noChanges = false;
        }
    }
    console.log('Mudança de instruções:', noChanges);

    clearHighlights();

    if (grammar !== undefined)
        grammar.restartStack();

    //cria uma nova gramatica apenas se alguma mudança ocorreu nas instruções
    if (!noChanges || firstCompile) {
        grammar = new Grammar(grammarProductions, nt_symbols.S);
        firstCompile = false;

        if (!grammar.checkIfLL1()) {
            console.error('Gramática não é LL1')
            return;
        }
    }

    //printa os first e follows
    // for (let nt of grammar.nonTerminals) {
    //     console.log('FIRST(' + nt + ') = ' + (new Array(...grammar.firstSet[nt]).join(' ')))
    //     console.log('FOLLOW(' + nt + ') = ' + (new Array(...grammar.followSet[nt]).join(' ')));
    // }
    console.log('Tabela de Parsing:', grammar.parsingTable);

    try {
        const parseTree = buildParseTree(source);
        const mifText = generateCode(parseTree.root);


        outputTextArea.value = mifText;
        outputEditor.setValue(outputTextArea.value);
    }
    catch (error) {
        displayError(error);
    }

    const endTime = new Date();
    const elapsedTime = endTime - startTime;
    console.log(`Compilação demorou ${elapsedTime} millisegundos`);
}

function buildParseTree(source) {
    const parseTree = new ParseTree(this.startSymbol);
    const lexer = new Lexer(source);
    const tokens = [];
    let token;

    //lê um token e passa pro parser
    while (true) {
        token = lexer.getToken();

        if (token == null) {
            throw new CompilingError(errorTypes.nullToken);
        }
        else {
            tokens.push(token);
            grammar.parseToken(token, parseTree);
        }

        //quando chegar no ultimo token acaba
        if (token.type === TerminalTypes.map.EOF) {
            break;
        }
    }

    console.log('Tokens: ', tokens);
    console.log('Arvore Sintática:', parseTree);

    return parseTree;
}

function addToInstructionList(inst) {
    const clone = document.importNode(instructionTemplate.content, true);
    instructionList.appendChild(clone);

    const newElem = instructionList.lastElementChild;
    const instName = newElem.querySelector('.instruction-name').children[0];
    const instCode = newElem.querySelector('.instruction-code').children[0];
    const instFormat = newElem.querySelector('.instruction-format').children[0];
    const instSuffix = newElem.querySelector('.instruction-suffix').children[0];
    const deleteButton = newElem.querySelector('.instruction-delete').children[0];

    instName.value = inst.name;
    instCode.value = inst.code;
    instFormat.value = inst.format;
    instSuffix.value = inst.suffix;


    //função que é chamada atravez do elemento da pagina
    newElem.update = function () {
        const wasChanged = instName.value.toUpperCase() !== inst.name ||
            instCode.value !== inst.code ||
            NonterminalTypes[instFormat.value] !== inst.format ||
            NonterminalTypes[instSuffix.value] !== inst.suffix;

        const failedPrev = newElem.classList.contains('failed-instruction');

        //so tenta atualizar se for necessario
        if (wasChanged || failedPrev) {
            try {
                inst.update(instName.value, instCode.value, NonterminalTypes[instFormat.value], NonterminalTypes[instSuffix.value]);
                newElem.classList.remove('failed-instruction');
                return true;

            }
            catch (error) {
                newElem.classList.add('failed-instruction');
                outputTextArea.value = `Instrução '${inst.name}' de código '0x${inst.code}'\n${error.name}`;
                outputEditor.setValue(outputTextArea.value);

                return false;
            }
        }

        //null significa que nao atualizou
        return null;
    };

    deleteButton.addEventListener("click", function () {
        inst.removeFromParser();
        newElem.remove();
        const index = instTemplates.indexOf(inst);
        delete instTemplates[index];
    });
}

function displayError(error) {
    if (error.startPos && error.endPos) {
        outputTextArea.value = `Linha ${error.startPos.line}, coluna ${error.startPos.ch}\n${error.name}`;

        inputEditor.markText(error.startPos, error.endPos, {
            className: 'highlighted',
        });
    }
    else
        outputTextArea.value = `${error.name}`;

    outputEditor.setValue(outputTextArea.value);
}

function clearHighlights() {
    const marks = inputEditor.getAllMarks();
    for (const mark of marks) {
        mark.clear();
    }
}

function downloadTextFile(text, fileName) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = fileName;

    a.click();

    URL.revokeObjectURL(url);
}