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


    inputEditor = CodeMirror.fromTextArea(inputTextArea, {
        lineNumbers: true,
        mode: 'text/x-perl',
    });

    inputEditor.setOption('theme', 'blackboard');
    inputEditor.setOption('placeholder', 'Insira seu código aqui...');

    outputEditor = CodeMirror.fromTextArea(outputTextArea, {
        lineNumbers: true,
        mode: 'text/x-perl',
        lineWrapping: true,
        readOnly: true,
    });

    outputEditor.setOption('theme', 'blackboard');
    outputEditor.setOption('placeholder', 'Arquivo .mif sai aqui...');


    compileButton.addEventListener("click", function () {
        compile(inputEditor.getValue());
    });

    addInstructionButton.addEventListener("click", function () {
        try {
            const newInst = new Instruction('', '', nt_symbols.R_FORMAT, nt_symbols.T1);
            instructions.push(newInst);
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
        //atualizar a textarea permite que o texto permanece caso atualiza a pagina
        inputTextArea.value = inputEditor.getValue();

        const marks = inputEditor.getAllMarks();
        for (const mark of marks) {
            mark.clear();
        }
    });


    //adiciona as instruções padrão ao parser e a lista
    for (let inst of instructions) {
        addToInstructionList(inst);
        inst.addToParser();
    }

};

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
    instFormat.value = inst.format.type;
    instSuffix.value = inst.suffix.type;

    newElem.update = function () {
        const wasChanged = instName.value.toUpperCase() !== inst.name ||
            instCode.value !== inst.code ||
            nt_symbols[instFormat.value] !== inst.format ||
            nt_symbols[instSuffix.value] !== inst.suffix;

        const failedPrev = newElem.classList.contains('failed-instruction');

        if (wasChanged || failedPrev) {

            try {
                inst.update(instName.value, instCode.value, nt_symbols[instFormat.value], nt_symbols[instSuffix.value]);
                newElem.classList.remove('failed-instruction');
                return true;

            } catch (error) {
                newElem.classList.add('failed-instruction');
                outputTextArea.value = `Instrução '${inst.name}' de código '${inst.code}'\n${error.name}`;
                outputEditor.setValue(outputTextArea.value);

                return false;
            }
        }
        return null;
    };

    deleteButton.addEventListener("click", function () {
        inst.removeFromParser();
        newElem.remove();
        const index = instructions.indexOf(inst);
        delete instructions[index];
    });

}
var grammar;
var firstCompile = true;

function compile(source) {
    const startTime = new Date();
    let noChanges = true;
    for (let elem of instructionList.children) {
        const updateResult = elem.update();
        if (updateResult === false) {
            return false;
        }
        else if (updateResult === true) {
            noChanges = false;
        }
    }
    console.log(noChanges)

    const marks = inputEditor.getAllMarks();
    for (const mark of marks) {
        mark.clear();
    }

    if (grammar !== undefined)
        grammar.restartStack();
    if (!noChanges || firstCompile) {
        grammar = new Grammar(grammarProductions, nt_symbols.S);
        firstCompile = false;
    }

    const parseTree = new ParseTree(this.startSymbol);

    let compilingError;

    const lexer = new Lexer(source);
    const tokens = [];
    let token;
    //TODO checar se é ll1

    if (!grammar.checkIfLL1()) {
        console.log('not ll1')
        return;
    }
    while (true) {
        try {
            token = lexer.getToken();
            tokens.push(token);
        }
        catch (error) {
            compilingError = error;
            handleError(compilingError);
            break;
        }


        if (token == null)
            break;

        try {
            grammar.parseToken(token, parseTree);
        }
        catch (error) {
            compilingError = error;
            console.log(error)
            handleError(compilingError);
            break;
        }

        if (token.type === TerminalTypes.map.EOF) {
            break;
        }
    }

    console.log('tokens: ', tokens);
    console.log(grammar.parsingTable)
    console.log(parseTree)
    // for (let nt of grammar.nonTerminals) {
    //     console.log('FIRST(' + nt + ') = ' + (new Array(...grammar.firstSet[nt]).join(' ')))
    //     console.log('FOLLOW(' + nt + ') = ' + (new Array(...grammar.followSet[nt]).join(' ')));
    // }

    let binary;
    if (!compilingError) {
        try {
            binary = convert(parseTree.root);
            outputTextArea.value = binary;
            outputEditor.setValue(outputTextArea.value);


            const parsedTree2 = grammar.parseAll(tokens);
            const binary2 = convert(parsedTree2.root);

            console.log(binary === binary2)

        } catch (error) {
            compilingError = error;
            console.log(error)
            handleError(compilingError);
        }
    }


    const endTime = new Date();

    // Calculate the time elapsed in milliseconds
    const elapsedTime = endTime - startTime;
    console.log(`Time elapsed: ${elapsedTime} milliseconds`);
}

function handleError(error) {
    outputTextArea.value = `Linha ${error.startPos.line + 1}, coluna ${error.startPos.ch + 1}\n${error.name}`;
    outputEditor.setValue(outputTextArea.value);


    inputEditor.markText(error.startPos, error.endPos, {
        className: 'highlighted',
    });
}

function findKeyByValue(object, value) {
    for (const key in object) {
        if (object[key] === value) {
            return key;
        }
    }
    return null;
}

function downloadTextFile(text, fileName) {
    // Create a Blob with the text content and set its MIME type
    const blob = new Blob([text], { type: 'text/plain' });

    // Create an object URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element and set its attributes
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;

    // Programmatically click the anchor to trigger the download
    a.click();

    // Clean up by revoking the object URL
    URL.revokeObjectURL(url);
}