const Elements = {
    infoPopUp: null,
    inputTextArea: null,
    outputTextArea: null,
    inputEditor: null,
    outputEditor: null,
    instructionTemplate: null,
    instructionList: null,
}

const Buttons = {
    addInstruction: null,
    download: null,
    copy: null,
    compile: null,
    parse: null,
    info: null,
    popClose: null,
}

var grammar;
var firstCompile = true;
var isCompiling = false;

window.onload = function () {
    Elements.infoPopUp = document.getElementById("info-pop-up");
    Elements.inputTextArea = document.getElementById("input-text-area");
    Elements.outputTextArea = document.getElementById("output-text-area");
    Elements.instructionList = document.getElementById("instruction-list");
    Elements.instructionTemplate = document.getElementById("instruction-item-template");

    Buttons.addInstruction = document.getElementById("add-instruction");
    Buttons.compile = document.getElementById("compile-button");
    Buttons.parse = document.getElementById("parse-button");
    Buttons.download = document.getElementById("download-button");
    Buttons.copy = document.getElementById("copy-button");
    Buttons.info = document.getElementById("info-button");
    Buttons.popClose = document.getElementById("pop-close");

    //cria os editores do CodeMirror
    Elements.inputEditor = CodeMirror.fromTextArea(Elements.inputTextArea, {
        lineNumbers: true,
        firstLineNumber: 0,
    });

    Elements.inputEditor.setOption('theme', 'blackboard');
    Elements.inputEditor.setOption('placeholder', 'Insira seu código aqui...');

    Elements.outputEditor = CodeMirror.fromTextArea(Elements.outputTextArea, {
        mode: '',
        lineNumbers: true,
        firstLineNumber: 0,
        lineWrapping: true,
        readOnly: true,
    });

    Elements.outputEditor.setOption('theme', 'blackboard');
    Elements.outputEditor.setOption('placeholder', 'Arquivo .mif sai aqui...');

    //EVENTOS
    Buttons.info.addEventListener("click", function () {
        Elements.infoPopUp.style.display = "block";
    });

    Buttons.popClose.addEventListener("click", function () {
        Elements.infoPopUp.style.display = "none";
    });

   
    Buttons.compile.addEventListener("click", function () {
        if (isCompiling) {
            cancelled = true;
        }
        else {
            cancelled = false;
            compile(Elements.inputEditor.getValue()).then(() => {
                blinkOutputArea();
            });
        }
    });

    Buttons.addInstruction.addEventListener("click", function () {
        try {
            const newInst = new Instruction('', '', NonterminalTypes.R_FORMAT, NonterminalTypes.T1);
            instTemplates.push(newInst);
            addToInstructionList(newInst);

            Elements.instructionList.scrollTop = Elements.instructionList.scrollHeight;
        }
        catch (error) {

        }
    });

    Buttons.download.addEventListener("click", function () {
        downloadTextFile(Elements.outputEditor.getValue(), 'instrucoes.mif')
    });

    Buttons.copy.addEventListener("click", function () {
        navigator.clipboard.writeText(Elements.outputEditor.getValue());
        blinkOutputArea();
    });

    Elements.inputEditor.on("change", function () {
        //atualizar a textarea permite que o texto permaneça caso atualize a pagina
        Elements.inputTextArea.value = Elements.inputEditor.getValue();

        clearHighlights();
    });


    //adiciona as instruções padrão ao parser e a lista
    for (let inst of instTemplates) {
        addToInstructionList(inst);
        inst.addToParser();
    }

};

async function compile(source) {
    isCompiling = true;

    const startTime = performance.now();

    let noChanges = true;

    //atualiza todas as instruções da lista
    for (let elem of Elements.instructionList.children) {
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

        Elements.outputTextArea.value = mifText;
        Elements.outputEditor.setValue(Elements.outputTextArea.value);
    }
    catch (error) {
        updateProgress(1);
        displayError(error);
    }
    finally {
        isCompiling = false;
    }

    const endTime = performance.now();
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
        if (count % 1000 == 0)
            await delay(1);

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
        Buttons.compile.style.background = `linear-gradient(to right, #1c2129 ${progress * 100}%, #12151d 0%)`;
        Buttons.compile.innerHTML = 'Cancelar';
    }
    else {
        Buttons.compile.style.removeProperty('background');
        Buttons.compile.innerHTML = 'Compilar';

    }
}

function addToInstructionList(inst) {
    const clone = document.importNode(Elements.instructionTemplate.content, true);
    Elements.instructionList.appendChild(clone);

    const newElem = Elements.instructionList.lastElementChild;
    const instName = newElem.querySelector('.instruction-name input');
    const instCode = newElem.querySelector('.instruction-code input');
    const instFormat = newElem.querySelector('.instruction-format select');
    const instSuffix = newElem.querySelector('.instruction-suffix select');
    const deleteButton = newElem.querySelector('.instruction-delete button');

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
                isCompiling = false;
                newElem.classList.add('failed-instruction');
                newElem.scrollIntoView();
                Elements.outputTextArea.value = `Instrução '${inst.name}' de código '0x${inst.code}'\n${error.name}`;
                Elements.outputEditor.setValue(Elements.outputTextArea.value);

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
        Elements.inputEditor.scrollIntoView(error.endPos, 50);

        Elements.outputTextArea.value = `Linha ${error.startPos.line}, coluna ${error.startPos.ch}\n${error.name}`;

        //caso esteja marcando um newline marca a linha toda
        if (Elements.inputEditor.getLine(error.startPos.line).length == error.startPos.ch) {
            error.startPos.ch = 0;
        }

        Elements.inputEditor.markText(error.startPos, error.endPos, {
            className: 'highlighted',
        });
    }
    else
        Elements.outputTextArea.value = `${error.name}`;

    Elements.outputEditor.setValue(Elements.outputTextArea.value);
}

function clearHighlights() {
    const marks = Elements.inputEditor.getAllMarks();
    for (const mark of marks) {
        mark.clear();
    }
}

function blinkOutputArea() {
    //animação quando aperta pra compilar
    document.getElementsByClassName("output-area")[0].animate(
        [
            { filter: "brightness(1.8)" },
            { filter: "brightness(1)" }
        ],
        {
            duration: 500,
            iterations: 1,
        }
    );
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
