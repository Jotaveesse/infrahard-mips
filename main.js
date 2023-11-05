var inputTextArea;
var outputTextArea;
var compileButton;
var parseButton;
var inputEditor;
var outputEditor;
var instructionTemplate;
var instructionList;
var addInstructionButton;

window.onload = function () {
    inputTextArea = document.getElementById("input-text-area");
    outputTextArea = document.getElementById("output-text-area");
    compileButton = document.getElementById("compile-button");
    parseButton = document.getElementById("parse-button");
    instructionList = document.getElementById("instruction-list");
    instructionTemplate = document.getElementById("instruction-item-template");
    addInstructionButton = document.getElementById("add-instruction");


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

    addInstructionButton.addEventListener("click", function () {
        try{
            const newInst = new Instruction('', '', nt_symbols.R_FORMAT, nt_symbols.T1);
            instructions.push(newInst);
            addToInstructionList(newInst);
        }
        catch(error){

        }
    });


    for (let inst of instructions) {
        inst.addToParser();
        addToInstructionList(inst);
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
        if (instName.value !== inst.name ||
            instCode.value !== inst.code ||
            nt_symbols[instFormat.value] !== inst.format ||
            nt_symbols[instSuffix.value] !== inst.suffix) {

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
        return true;
    };

    deleteButton.addEventListener("click", function () {
        inst.removeFromParser();
        newElem.remove();
        const index = instructions.indexOf(inst);
        delete instructions[index];
    });

}

function compile(source) {
    for (let elem of instructionList.children) {
        if (!elem.update()){
            console.log(elem)
            return false;
        }
    }

    const marks = inputEditor.getAllMarks();
    for (const mark of marks) {
        mark.clear();
    }

    const grammar = new Grammar(grammarProductions, nt_symbols.S);
    const parseTree = new ParseTree(this.startSymbol);

    var let;
    var let;

    const lexer = new Lexer(source);
    const tokens = [];
    let token;

    while (true) {
        try {
            token = lexer.getToken();
            tokens.push(token);
        }
        catch (error) {
            let = error;
            handleError(let);
            break;
        }


        if (token == null)
            break;

        try {
            grammar.parseToken(token, parseTree);
        }
        catch (error) {
            let = error;
            console.log(error)
            handleError(let);
            break;
        }

        if (token.type === TerminalTypes.map.EOF) {
            break;
        }
    }

    console.log('tokens: ', tokens);
    console.log(grammar.parsingTable)
    // for (let nt of grammar.nonTerminals) {
    //     console.log('FIRST(' + nt + ') = ' + (new Array(...grammar.firstSet[nt]).join(' ')))
    //     console.log('FOLLOW(' + nt + ') = ' + (new Array(...grammar.followSet[nt]).join(' ')));
    // }

    let binary;
    if (!let && !let) {
        binary = convert(parseTree.root);
        outputTextArea.value = binary;
        outputEditor.setValue(outputTextArea.value);


        const parsedTree2 = grammar.parseAll(tokens);
        const binary2 = convert(parsedTree2.root);

        console.log(binary === binary2)
    }
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
