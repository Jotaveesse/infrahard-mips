var infoPopUp;
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
var infoButton;
var popCloseButton;

window.onload = function () {
    infoPopUp = document.getElementById("info-pop-up");
    inputTextArea = document.getElementById("input-text-area");
    outputTextArea = document.getElementById("output-text-area");
    instructionList = document.getElementById("instruction-list");
    instructionTemplate = document.getElementById("instruction-item-template");

    addInstructionButton = document.getElementById("add-instruction");
    compileButton = document.getElementById("compile-button");
    parseButton = document.getElementById("parse-button");
    downloadButton = document.getElementById("download-button");
    copyButton = document.getElementById("copy-button");
    infoButton = document.getElementById("info-button");
    popCloseButton = document.getElementById("pop-close");

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
    infoButton.addEventListener("click", function () {
        infoPopUp.style.display = "block";
    });

    popCloseButton.addEventListener("click", function () {
        infoPopUp.style.display = "none";
    });


    compileButton.addEventListener("click", function () {
        if (compiling) {
            cancelled = true;
        }
        else {
            //animação quando aperta pra compilar
            document.getElementsByClassName("output-area")[0].animate(
                [
                    { filter: "brightness(1.4)" },
                    { filter: "brightness(1)" }
                ],
                {
                    duration: 500,
                    iterations: 1,
                }
            );
            cancelled = false;
            compile(inputEditor.getValue());
        }
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

    copyButton.addEventListener("click", function () {
        navigator.clipboard.writeText(outputEditor.getValue());
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
var compiling = false;

async function compile(source) {
    compiling = true;

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
    console.log('Mudança de instruções:', !noChanges);

    clearHighlights();

    if (grammar !== undefined)
        grammar.restartStacks();

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
        const parseTree = await buildParseTree(source);
        const mifText = generateCode(parseTree.root);

        outputTextArea.value = mifText;
        outputEditor.setValue(outputTextArea.value);
    }
    catch (error) {
        updateProgress(1);
        displayError(error);
    }
    finally {
        compiling = false;
    }

    const endTime = new Date();
    const elapsedTime = endTime - startTime;
    console.log(`Compilação demorou ${elapsedTime} millisegundos`);
}

async function buildParseTree(source) {
    const parseTree = new ParseTree(this.startSymbol);
    const lexer = new Lexer(source);
    const tokens = [];
    const totalLines = source.split('\n').length - 1;
    let linesParsed = 0;
    let token;
    let count = 0;

    //lê um token e passa pro parser
    while (true) {
        token = lexer.getToken();

        if (token == null) {
            throw new CompilingError(errorTypes.nullToken);
        }
        else {
            tokens.push(token);
            grammar.parseToken(token, parseTree);

            linesParsed = token.line;
            updateProgress(linesParsed / totalLines);
        }

        //quando chegar no ultimo token acaba
        if (token.type === TerminalTypes.map.EOF) {
            break;
        }

        //delay para permitir que a UI seja atualizada
        count++;
        if (count % 100 == 0)
            await delay(10);

        if (cancelled) {
            updateProgress(1);  //atualiza progresso para o final
            throw new CompilingError(errorTypes.compilationCancelled);
        }
    }

    console.log('Tokens: ', tokens);
    console.log('Arvore Sintática:', parseTree);

    return parseTree;
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function updateProgress(progress) {
    if (progress < 1) {
        compileButton.style.background = `linear-gradient(to right, #1c2129 ${progress * 100}%, #12151d 0%)`;
        compileButton.innerHTML = 'Cancelar';
    }
    else {
        compileButton.style.removeProperty('background');
        compileButton.innerHTML = 'Compilar';

    }
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


    //função que é chamada atraves do elemento da pagina
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
                compiling = false;
                newElem.classList.add('failed-instruction');
                newElem.scrollIntoView();
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
        inputEditor.scrollIntoView(error.endPos, 50);

        outputTextArea.value = `Linha ${error.startPos.line}, coluna ${error.startPos.ch}\n${error.name}`;

        //caso esteja marcando um newline marca a linha toda
        if (inputEditor.getLine(error.startPos.line).length == error.startPos.ch) {
            error.startPos.ch = 0;
        }

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
