

function convert(parseNode) {
    var converted = '';
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
                    console.log(prod.terminals[0])
                    segments[prod.symbol.name] = parseInt(removeCharacter(prod.terminals[0].value, '$'));
                }
                else {
                    segments[prod.symbol.name] = parseInt(removeCharacter(prod.value, '$'));
                }
            }

            if (format.symbol.name === 'R') {
                segments.FUNCT = 32;
            }
            else {
                segments.OPCODE = 32;
            }
            console.log(segments)
            if (format.symbol.name === 'R') {
                getBinarySegments(segments);
                let binaryCode = segments.OPCODE + segments.RS + segments.RT + segments.RD + segments.SHAMT + segments.FUNCT;
                binaryCode = addNewlines(binaryCode, 8);

                converted += binaryCode;
            }
        }
        else {
            converted += '\n'+convert(nonterminal);
        }

    }
    return converted;
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
    var binary = num.toString(2);

    while (binary.length < size)
        binary = '0' + binary;
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