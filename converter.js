const codes = {
    ADD: '20',
    AND: '24',
    DIV: '1a',
    MULT: '18',
    JR: '8',
    MFHI: '10',
    MFLO: '12',
    SLL: '0',
    SLLV: '4',
    SLT: '2a',
    SRA: '3',
    SRAV: '7',
    SRL: '2',
    SUB: '22',
    BREAK: 'd',
    RTE: '13',
    ADDI: '8',
    ADDIU: '9',
    BEQ: '4',
    BNE: '5',
    BLE: '6',
    BGT: '7',
    LB: '20',
    LH: '21',
    LUI: 'f',
    LW: '23',
    SB: '28',
    SH: '29',
    SLTI: 'a',
    SW: '2b',
    J: '2',
    JAL: '3',
}

function convert(parseNode) {
    var converted = [];

    // itera sobre todos os nós não terminais da arvore,
    //como a arvore está invertida itera do final para o começo
    for (let i = parseNode.nonterminals.length - 1; i >= 0; i--) {
        const nonterminal = parseNode.nonterminals[i];

        if (nonterminal.symbol.type == 'INST') {
            const format = nonterminal.nonterminals[0];
            const inst = format.nonterminals[0];
            const suffix = inst.nonterminals[0];

            //valores padrão de cada segmento
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

            //extrai os numeros dos registradores, shamt, offset e adress
            for (const prod of suffix.nonterminals) {
                if (prod.terminals.length !== 0) {
                    segments[prod.symbol.type] = parseInt(removeCharacter(prod.terminals[0].value, '$'));
                }
            }

            //console.log(inst.symbol.type)
            if (format.symbol === nt_symbols.R_FORMAT) {
                segments.FUNCT = parseInt(codes[inst.symbol.type], 16);
            }
            else {
                segments.OPCODE = parseInt(codes[inst.symbol.type], 16);
            }

            let binaryCode;

            if (format.symbol === nt_symbols.R_FORMAT) {
                getBinarySegments(segments);
                binaryCode = segments.OPCODE + segments.RS + segments.RT + segments.RD + segments.SHAMT + segments.FUNCT;
                binaryCode = addNewlines(binaryCode, 8);

            }
            else if (format.symbol === nt_symbols.I_FORMAT) {
                getBinarySegments(segments);
                binaryCode = segments.OPCODE + segments.RS + segments.RT + segments.OFFSET;
                binaryCode = addNewlines(binaryCode, 8);

            }
            if (format.symbol === nt_symbols.J_FORMAT) {
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

    while (binary.length < size) {
        binary = (num >= 0 ? '0' : '1') + binary;
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