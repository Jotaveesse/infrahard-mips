function intToMinDigitsString(number, minDigits) {
    const numberString = number.toString();
    const padding = '0'.repeat(Math.max(0, minDigits - numberString.length));
    return padding + numberString;
}

function getInstString(suffix, inst, segs) {
    inst = inst.toLowerCase();
    switch (suffix) {
        case NonterminalTypes.T1:
            return inst;
        case NonterminalTypes.T2:
            return `${inst} $${segs.RS}`;
        case NonterminalTypes.T3:
            return `${inst} $${segs.RD}`;
        case NonterminalTypes.T4:
            return `${inst} $${segs.RS}, $${segs.RT}`;
        case NonterminalTypes.T5:
            return `${inst} $${segs.RD}, $${segs.RS}, $${segs.RT}`;
        case NonterminalTypes.T6:
            return `${inst} ${segs.ADDRESS}`;
        case NonterminalTypes.T7:
            return `${inst} $${segs.RT}, ${segs.OFFSET}`;
        case NonterminalTypes.T8:
            return `${inst} $${segs.RD}, $${segs.RT}, ${segs.SHAMT}`;
        case NonterminalTypes.T9:
            return `${inst} $${segs.RS}, $${segs.RT}, ${segs.OFFSET}`;
        case NonterminalTypes.T10:
            return `${inst} $${segs.RT}, $${segs.RS}, ${segs.OFFSET}`;
        case NonterminalTypes.T11:
            return `${inst} $${segs.RT}, ${segs.OFFSET}($${segs.RS})`;
    }
}

function convert(rootNode) {
    var converted = [];
    const labels = getLabels(rootNode);
    console.log(labels)
    convRec(rootNode, converted, labels);
    return formatCode(converted);
}
function getLabels(parseNode) {
    const labels = {};
    const stack = [];
    var instCount = 0;

    stack.push(parseNode);

    while (stack.length > 0) {
        const current = stack.shift();

        if (current.nonterminals) {
            for (let i = current.nonterminals.length - 1; i >= 0; i--) {
                const nonterminal = current.nonterminals[i];

                if (nonterminal.symbol.type === NonterminalTypes.B) {
                    if (nonterminal.terminals.length === 2) {
                        labels[nonterminal.terminals[1].value] = instCount;
                    }
                }
                else if (nonterminal.symbol.type === NonterminalTypes.INST) {
                    nonterminal.position = instCount;
                    instCount++;
                }
                else {
                    stack.push(nonterminal);
                }
            }
        }
    }

    return labels;
}


function convRec(parseNode, converted, labels) {
    // itera sobre todos os nós não terminais da arvore,
    //como a arvore está invertida itera do final para o começo
    for (let i = parseNode.nonterminals.length - 1; i >= 0; i--) {
        const nonterminal = parseNode.nonterminals[i];

        if (nonterminal.symbol.type === NonterminalTypes.INST) {
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

            //extrai os numeros dos registradores, shamt, offset e address
            for (const prod of suffix.nonterminals) {
                if (prod.terminals.length !== 0) {

                    if (prod.symbol.type == NonterminalTypes.T9_1) {
                        if (prod.terminals[0].symbol.type === TerminalTypes.map.LABEL) {
                            const labelValue = labels[prod.terminals[0].value];
                            if (labelValue !== undefined) {
                                segments.OFFSET = labels[prod.terminals[0].value] - nonterminal.position - 1;
                            }
                            else {
                                throw new CompilingError(errorTypes.invalidLabel, prod.terminals[0].start, prod.terminals[0].end,
                                    prod.terminals[0].value);
                            }
                        }
                        else
                            segments.OFFSET = parseInt(prod.terminals[0].value);
                    }

                    //caso seja caso especial do T6
                    else if (prod.terminals[0].symbol.type === TerminalTypes.map.LABEL) {
                        const labelValue = labels[prod.terminals[0].value];
                        if (labelValue !== undefined) {
                            segments[prod.symbol.type] = labels[prod.terminals[0].value];
                        }
                        else {
                            throw new CompilingError(errorTypes.invalidLabel, prod.terminals[0].start, prod.terminals[0].end,
                                prod.terminals[0].value);
                        }
                    }

                    else
                        segments[prod.symbol.type] = parseInt(removeCharacter(prod.terminals[0].value, '$'));
                }
            }

            // se for formato R o codigo fica no funct
            if (format.symbol.type === NonterminalTypes.R_FORMAT) {
                segments.FUNCT = parseInt(codes[inst.symbol.type], 16);
            }
            else {
                segments.OPCODE = parseInt(codes[inst.symbol.type], 16);
            }

            const instComment = getInstString(suffix.symbol.type, inst.symbol.type, segments);

            let binaryCode;

            if (format.symbol.type === NonterminalTypes.R_FORMAT) {
                getBinarySegments(segments);
                binaryCode = segments.OPCODE + segments.RS + segments.RT + segments.RD + segments.SHAMT + segments.FUNCT;
                binaryCode = formatInstruction(binaryCode, 8, instComment);

            }
            else if (format.symbol.type === NonterminalTypes.I_FORMAT) {
                getBinarySegments(segments);
                binaryCode = segments.OPCODE + segments.RS + segments.RT + segments.OFFSET;
                binaryCode = formatInstruction(binaryCode, 8, instComment);

            }
            else if (format.symbol.type === NonterminalTypes.J_FORMAT) {
                getBinarySegments(segments);
                binaryCode = segments.OPCODE + segments.ADDRESS;
                binaryCode = formatInstruction(binaryCode, 8, instComment);
            }
            converted.push(binaryCode);
        }
        else {
            convRec(nonterminal, converted, labels);
        }

    }
}

function formatCode(instructions) {
    const initialString = `DEPTH = ${instructions.length * 4};\nWIDTH = 8;\n\nADDRESS_RADIX = DEC;\nDATA_RADIX = BIN;\nCONTENT\nBEGIN\n\n`;

    let mergedLines = [];

    for (let i = 0; i < instructions.length; i++) {

        for (let j = 0; j < instructions[i].length; j++) {
            const addressNum = intToMinDigitsString(i * 4 + j, 3);
            instructions[i][j] = `${addressNum} : ${instructions[i][j]}`;
        }

        mergedLines[i] = instructions[i].join('\n');
    }

    let mergedInsts = mergedLines.join('\n\n');

    return initialString + mergedInsts + '\n\nEND;'
}

function formatInstruction(inputString, n, comment) {
    const regexPattern = new RegExp(`.{1,${n}}`, 'g');
    let byteStrings = inputString.match(regexPattern).reverse();
    byteStrings = byteStrings.map((inst) => inst + ';');
    byteStrings[0] += ' --' + comment;

    return byteStrings;
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
    if (num < 0) {
        num = (1 << size) + num; // Convert negative number to its two's complement representation
    }

    var binary = num.toString(2);

    while (binary.length < size) {
        binary = '0' + binary;
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