const codes = {
    ADD: parseInt('20', 16),
    AND: parseInt('24', 16),
    DIV: parseInt('1a', 16),
    MULT: parseInt('18', 16),
    JR: parseInt('8', 16),
    MFHI: parseInt('10', 16),
    MFLO: parseInt('12', 16),
    SLL: parseInt('0', 16),
    SLLV: parseInt('4', 16),
    SLT: parseInt('2a', 16),
    SRA: parseInt('3', 16),
    SRAV: parseInt('7', 16),
    SRL: parseInt('2', 16),
    SUB: parseInt('22', 16),
    BREAK: parseInt('d', 16),
    RTE: parseInt('13', 16),
    ADDI: parseInt('8', 16),
    ADDIU: parseInt('9', 16),
    BEQ: parseInt('4', 16),
    BNE: parseInt('5', 16),
    BLE: parseInt('6', 16),
    BGT: parseInt('7', 16),
    LB: parseInt('20', 16),
    LH: parseInt('21', 16),
    LUI: parseInt('f', 16),
    LW: parseInt('23', 16),
    SB: parseInt('28', 16),
    SH: parseInt('29', 16),
    SLTI: parseInt('a', 16),
    SW: parseInt('2b', 16),
    J: parseInt('2', 16),
    JAL: parseInt('3', 16),
}


function convert(parseNode) {
    var converted = [];
    for (let i = parseNode.nonterminals.length - 1; i >= 0; i--) {
        const segments = {
            OPCODE: '0',
            FUNCT: '0',
            RS: '0',
            RT: '0',
            RD: '0',
            SHAMT: '0',
            OFFSET: '0',
            ADDRESS: '0'
        }

        const nonterminal = parseNode.nonterminals[i];

        if (nonterminal.symbol.name == 'INST') {
            const format = nonterminal.nonterminals[0];
            const inst = format.nonterminals[0];
            const suffix = inst.nonterminals[0];

            for (const prod of suffix.nonterminals) {
                if (prod.terminals.length !== 0) {
                    //console.log(prod.terminals[0])
                    segments[prod.symbol.name] = parseInt(removeCharacter(prod.terminals[0].value, '$'));
                }
                //TODO remover esse else
                else {
                    console.log('uhhh',suffix)
                    //segments[prod.symbol.name] = parseInt(removeCharacter(prod.symbol.name, '$'));
                }
            }

            //console.log(inst.symbol.name)
            if (format.symbol.name === 'R_FORMAT') {
                segments.FUNCT = codes[inst.symbol.name];
            }
            else {
                segments.OPCODE = codes[inst.symbol.name];
            }
            console.log(segments)

            let binaryCode;

            if (format.symbol.name === 'R_FORMAT') {
                getBinarySegments(segments);
                binaryCode = segments.OPCODE + segments.RS + segments.RT + segments.RD + segments.SHAMT + segments.FUNCT;
                binaryCode = addNewlines(binaryCode, 8);

            }
            else if (format.symbol.name === 'I_FORMAT') {
                getBinarySegments(segments);
                binaryCode = segments.OPCODE + segments.RS + segments.RT + segments.OFFSET;
                binaryCode = addNewlines(binaryCode, 8);

            }
            if (format.symbol.name === 'J_FORMAT') {
                getBinarySegments(segments);
                binaryCode = segments.OPCODE + segments.ADDRESS;
                binaryCode = addNewlines(binaryCode, 8);

            }
            converted.push(binaryCode);
        }
        else {
            converted.push(convert(nonterminal));
        }

    }
    return converted.join('\n\n');
}

function addNewlines(inputString, n) {
    const regexPattern = new RegExp(`.{1,${n}}`, 'g');
    return inputString.match(regexPattern).reverse().join('\n');
}

function getBinarySegments(segments) {
    segments.OPCODE = numberToBinary(segments.OPCODE, 6);
    segments.FUNCT = numberToBinary(segments.FUNCT, 6);
    segments.RS = numberToBinary(segments.RS, 5);
    segments.RT = numberToBinary(segments.RT, 5);
    segments.RD = numberToBinary(segments.RD, 5);
    segments.SHAMT = numberToBinary(segments.SHAMT, 5);
    segments.OFFSET = numberToBinary(segments.OFFSET, 16);
    segments.ADDRESS = numberToBinary(segments.ADDRESS, 26);
}

function numberToBinary(num, size) {
    var binary = Math.abs(num).toString(2);

    while (binary.length < size){
        binary = (num>=0?'0':'1') + binary;
    }
    return binary;
}

function removeCharacter(inputString, charToRemove) {
    const index = inputString.indexOf(charToRemove);

    if (index === -1) {
        // Character not found in the string
        return inputString;
    }

    const beforeChar = inputString.slice(0, index);
    const afterChar = inputString.slice(index + 1);

    return beforeChar + afterChar;
}