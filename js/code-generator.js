function generateCode(rootNode) {
    const stack = [];
    const converted = [];
    stack.unshift(rootNode);

    const labels = setLabels(rootNode);
    console.log('Labels:', labels);

    // navega pela arvore da esquerda pra direita
    while (stack.length > 0) {
        const parseNode = stack.shift();

        for (const nonterminal of parseNode.nonterminals) {
            if (nonterminal.symbol.type === NonterminalTypes.INST) {
                const format = nonterminal.nonterminals[0];
                const inst = format.nonterminals[0];
                const suffix = inst.nonterminals[0];

                //valores padrão de cada segmento
                const segments = {
                    INST: format.nonterminals[0].symbol.type.replace('_INST','').toLowerCase(),
                    INTER_INST: format.nonterminals[0].symbol.type,
                    FORMAT: nonterminal.nonterminals[0].symbol.type,
                    SUFFIX: inst.nonterminals[0].symbol.type,
                    OPCODE: '0',
                    FUNCT: '0',
                    RS: '0',
                    RT: '0',
                    RD: '0',
                    SHAMT: '0',
                    OFFSET: '0',
                    ADDRESS: '0',
                    POSITION: nonterminal.position
                }

                //extrai os numeros dos registradores, shamt, offset, address e labels
                for (const prod of suffix.nonterminals) {
                    if (prod.terminals.length !== 0) {

                        //caso seja caso especial do T9
                        if (prod.symbol.type == NonterminalTypes.T9_1) {
                            //se for label
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
                                segments.ADDRESS = labels[prod.terminals[0].value];
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
                if (segments.FORMAT === NonterminalTypes.R_FORMAT) {
                    segments.FUNCT = parseInt(instCodes[segments.INTER_INST], 16);
                }
                else {
                    segments.OPCODE = parseInt(instCodes[segments.INTER_INST], 16);
                }

                //converte os segmentos para o texto em binario
                const binInst = convertInstruction(segments);
                const convInst = formatInstruction(binInst, segments);

                converted.push(convInst);
            }
            else {
                stack.push(nonterminal);
            }
        }
    }

    return formatCode(converted, 0);
}

//cria a lista de labels para onde apontam
function setLabels(parseNode) {
    const labels = {};
    const stack = [];
    let instCount = 0;

    stack.push(parseNode);

    //navega pela arvore da esquerda  pra direita
    while (stack.length > 0) {
        //pega a primeira da lista
        const current = stack.shift();

        if (current.nonterminals) {
            for (const nt of current.nonterminals) {

                // se for um nó de declaração de label salva o endereço que ela aponta
                if (nt.symbol.type === NonterminalTypes.OPT_LABEL) {
                    if (nt.terminals[0].symbol.type === TerminalTypes.map.LABEL_DECL) {
                        labels[nt.terminals[0].value] = instCount;
                    }
                }
                // se for uma instrução salva o endereço dela no nó
                else if (nt.symbol.type === NonterminalTypes.INST) {
                    nt.position = instCount;
                    instCount++;
                }
                else {
                    stack.push(nt);
                }
            }
        }
    }

    return labels;
}

//converte os segmentos da instrução no seu binario de 32 bits
function convertInstruction(segments) {

    let binaryCode;

    const binarySegs = getBinarySegments({ ...segments });
    if (binarySegs.FORMAT === NonterminalTypes.R_FORMAT) {
        binaryCode = binarySegs.OPCODE + binarySegs.RS + binarySegs.RT + binarySegs.RD + binarySegs.SHAMT + binarySegs.FUNCT;
    }
    else if (binarySegs.FORMAT === NonterminalTypes.I_FORMAT) {
        binaryCode = binarySegs.OPCODE + binarySegs.RS + binarySegs.RT + binarySegs.OFFSET;
    }
    else if (binarySegs.FORMAT === NonterminalTypes.J_FORMAT) {
        binaryCode = binarySegs.OPCODE + binarySegs.ADDRESS;
    }

    return binaryCode;
}

//adiciona a formatação de uma instruçao
function formatInstruction(inputString, segments) {
    const splitRegex = new RegExp(`.{1,${8}}`, 'g');
    const instComment = getInstString(segments);

    //divide a instrução em varias linhas de 8 bits
    const byteStrings = inputString.match(splitRegex).reverse();

    //adiciona o numero da linha
    for (let i = 0; i < byteStrings.length; i++) {
        const lineNum = segments.POSITION * 4 + i;
        byteStrings[i] = `${padNumber(lineNum, 3)} : ${byteStrings[i]};`;
    }
    byteStrings[0] += ' --' + instComment;

    return byteStrings;
}

//adiciona a formatacao do codigo inteiro e une as instruções
function formatCode(instructions, minLength) {
    const initialString = `DEPTH = ${Math.max(instructions.length, minLength) * 4};\nWIDTH = 8;\n\nADDRESS_RADIX = DEC;\nDATA_RADIX = BIN;\nCONTENT\nBEGIN\n\n`;

    let mergedLines = [];

    for (let i = 0; i < instructions.length; i++) {
        mergedLines[i] = instructions[i].join('\n');
    }

    while(mergedLines.length < minLength){
        mergedLines.push(`${padNumber(mergedLines.length * 4, 3)} : 00000000;\n${padNumber(mergedLines.length * 4 + 1, 3)} : 00000000;\n${padNumber(mergedLines.length * 4 + 2, 3)} : 00000000;\n${padNumber(mergedLines.length * 4 + 3, 3)} : 00000000;`)
    }

    let mergedInsts = mergedLines.join('\n\n');

    return initialString + mergedInsts + '\n\nEND;'
}

//transforma os segmentos em valores binarios
function getBinarySegments(segments) {
    segments.OPCODE = numberToBinary(segments.OPCODE, 6);
    segments.FUNCT = numberToBinary(segments.FUNCT, 6);
    segments.RS = numberToBinary(segments.RS, 5);
    segments.RT = numberToBinary(segments.RT, 5);
    segments.RD = numberToBinary(segments.RD, 5);
    segments.SHAMT = numberToBinary(segments.SHAMT, 5);
    segments.OFFSET = numberToBinary(segments.OFFSET, 16);
    segments.ADDRESS = numberToBinary(segments.ADDRESS, 26);

    return segments;
}


// monta instruções com base nos segmentos
function getInstString(segs) {
    switch (segs.SUFFIX) {
        case NonterminalTypes.T1:
            return segs.INST;
        case NonterminalTypes.T2:
            return `${segs.INST} $${segs.RS}`;
        case NonterminalTypes.T3:
            return `${segs.INST} $${segs.RD}`;
        case NonterminalTypes.T4:
            return `${segs.INST} $${segs.RS}, $${segs.RT}`;
        case NonterminalTypes.T5:
            return `${segs.INST} $${segs.RD}, $${segs.RS}, $${segs.RT}`;
        case NonterminalTypes.T6:
            return `${segs.INST} ${segs.ADDRESS}`;
        case NonterminalTypes.T7:
            return `${segs.INST} $${segs.RT}, ${segs.OFFSET}`;
        case NonterminalTypes.T8:
            return `${segs.INST} $${segs.RD}, $${segs.RT}, ${segs.SHAMT}`;
        case NonterminalTypes.T9:
            return `${segs.INST} $${segs.RS}, $${segs.RT}, ${segs.OFFSET}`;
        case NonterminalTypes.T10:
            return `${segs.INST} $${segs.RT}, $${segs.RS}, ${segs.OFFSET}`;
        case NonterminalTypes.T11:
            return `${segs.INST} $${segs.RT}, ${segs.OFFSET}($${segs.RS})`;
    }
}
