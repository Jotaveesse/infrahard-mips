class Grammar {
    constructor(productions, startSymbol) {
        this.productions = productions;
        this.startSymbol = startSymbol;
        this.nonTerminals = new Set();
        this.terminals = new Set();

        for (const p of productions) {
            this.nonTerminals.add(p.nonterminal);
            for (const s of p.production) {
                if (s instanceof Terminal) {
                    this.terminals.add(s);
                }
            }
        }

        this.firstSet = {};
        this.followSet = {};
        this.parsingTable = {};

        //TODO reiniciair perm stack
        this.permStack = [EOF, this.startSymbol];;

        this.buildFirstSets();
        this.buildFollowSets();
        this.generateParsingTable();
    }

    buildFirstSets() {
        for (const t of this.terminals) {
            this.firstSet[t] = new Set([t]);
        }

        for (const nt of this.nonTerminals) {
            this.firstSet[nt] = new Set();
        }
        this.firstSet[EOF] = new Set([EOF]);
        this.firstSet[EPSILON] = new Set([EPSILON]);

        let prevFollowSet = {};

        while (!areObjectSetsEqual(prevFollowSet, this.firstSet)) {
            prevFollowSet = structuredClone(this.firstSet);

            //para cada produção
            for (const rule of this.productions) {
                //para cada simbolo da produção
                for (let i = 0; i < rule.production.length; i++) {
                    const symbol = rule.production[i];
                    //console.log(symbol)
                    const symbolFirst = new Set(this.firstSet[symbol]);

                    //caso o first nao tenha epsilon já pode acabar aqui
                    //caso contrario continua adicionando os firsts dos proximos simbolos
                    if (!symbolFirst.has(EPSILON)) {
                        this.firstSet[rule.nonterminal] = new Set([...this.firstSet[rule.nonterminal], ...symbolFirst]);
                        break;
                    }
                    else if (i < rule.production.length - 1) {
                        symbolFirst.delete(EPSILON);
                        this.firstSet[rule.nonterminal] = new Set([...this.firstSet[rule.nonterminal], ...symbolFirst]);
                    }
                    else {
                        this.firstSet[rule.nonterminal] = new Set([...this.firstSet[rule.nonterminal], ...symbolFirst]);
                    }
                }
            }
        }
    }

    buildFollowSets() {
        // inicializa os follows
        for (const nt of this.nonTerminals) {
            this.followSet[nt] = new Set();
        }

        this.followSet[this.startSymbol].add(EOF);

        let prevFollowSet = {};

        while (!areObjectSetsEqual(prevFollowSet, this.followSet)) {
            prevFollowSet = structuredClone(this.followSet);

            //para cada produção
            for (const rule of this.productions) {
                //para cada simbolo da produção
                for (let i = 0; i < rule.production.length; i++) {
                    const symbol = rule.production[i];

                    if (symbol instanceof Nonterminal) {
                        this.followSet[symbol] = new Set([...this.followSet[symbol], ...this.getSymbolFollows(rule, i)]);
                    }
                }
            }
        }

    }

    getSymbolFollows(rule, currIndex) {
        const symbol = rule.production[currIndex];
        //console.log(symbol)
        if (symbol instanceof Nonterminal) {
            let follows;

            //se esse não for o ultimo simbolo
            if (currIndex < rule.production.length - 1) {
                follows = new Set(this.firstSet[rule.production[currIndex + 1]]);   //pega firsts to proximo simbolo
            }
            //se for ultimo simbolo
            else {
                follows = new Set(this.followSet[rule.nonterminal]);    //pega follow do simbolo da regra
            }

            //caso o proximo simbolo tenha epsilon
            if (follows.has(EPSILON)) {
                follows.delete(EPSILON);

                const nextFirst = this.getSymbolFollows(rule, currIndex + 1);  //pega follow do proximo simbolo

                follows = new Set([...nextFirst, ...follows]);
            }

            return follows;
        }
        else {
            //return new Set();
        }
    }
    generateParsingTable() {
        for (const nt of this.nonTerminals) {
            this.parsingTable[nt] = {};
            for (const t of this.terminals) {
                this.parsingTable[nt][t.type] = [];
            }

            this.parsingTable[nt][EOF] = [];
        }

        for (const prod of this.productions) {
            const prodFirstSet = {};
            for (const t of this.terminals) {
                prodFirstSet[t.type] = new Set([t]);
            }

            for (const nt of this.nonTerminals) {
                prodFirstSet[nt] = new Set();
            }

            for (const firstTerminal of this.firstSet[prod.production[0]]) {
                if (prod.production[0] === EPSILON) {
                    //talvez esteja errado pq deveria pegar o follow do proximo simbolo
                    for (const followTerminal of this.followSet[prod.nonterminal]) {
                        this.parsingTable[prod.nonterminal.type][followTerminal.type].push(prod.production);
                    }
                } else if (firstTerminal === EPSILON) {
                    if (prod.production.length >= 2) {
                        for (const nextFirstTerminal of this.firstSet[prod.production[1]]) {
                            this.parsingTable[prod.nonterminal.type][nextFirstTerminal.type].push(prod.production);
                        }
                    }
                    else {
                        for (const followTerminal of this.followSet[prod.nonterminal]) {
                            this.parsingTable[prod.nonterminal.type][followTerminal.type].push(prod.production);
                        }
                    }
                } else {
                    this.parsingTable[prod.nonterminal.type][firstTerminal.type].push(prod.production);
                }
            }
        }
    }

    checkIfLL1() {
        for (const nt of this.nonTerminals) {
            for (const t of this.terminals) {
                if (this.parsingTable[nt][t.type].length > 1) {
                    console.log('Erro na tabela: ', nt, t.type);
                    return false;
                }
            }
        }
        return true;
    }

    parseToken(currToken, parseTree) {
        let stackTop = this.permStack[this.permStack.length - 1];
        const startPos = { line: currToken.line, ch: currToken.column };
        const endPos = { line: currToken.line, ch: currToken.column + currToken.text.length };

        while (true) {
            //converte os tokens number para tipos numericos especificos
            if (currToken.type === TerminalTypes.map.NUMBER) {
                if (stackTop.type == NonterminalTypes.OFFSET)
                    currToken.type = TerminalTypes.map.OFFSET;
                else if (stackTop.type == NonterminalTypes.SHAMT)
                    currToken.type = TerminalTypes.map.SHAMT;
                else if (stackTop.type == TerminalTypes.map.ADDRESS || stackTop.type == NonterminalTypes.T6)
                    currToken.type = TerminalTypes.map.ADDRESS;
                else {
                    console.log('hu')

                    const validTerminals=this.parsingTable[stackTop];
                    const validTokens = Object.keys(validTerminals).filter((key) => validTerminals[key].length > 0).map((val)=>TerminalTypes.revMap[val]);
                    
                    throw new CompilingError(errorTypes.invalidToken, startPos, endPos,
                        validTokens.display(), TerminalTypes.revMap[currToken.type]);
                }
            }

            if (stackTop instanceof Terminal) {
                //TODO melhorar isso
                if (currToken.type === TerminalTypes.map.SHAMT || currToken.type === TerminalTypes.map.OFFSET || currToken.type === TerminalTypes.map.ADDRESS) {
                    var bitCount = countBits(currToken.text);

                    // remove ultimo elemento da pilha e vai pro proximo token
                    this.permStack.pop();

                    let bitLimit;
                    if (currToken.type === TerminalTypes.map.SHAMT) {
                        if (currToken.text < 0) {
                            throw new CompilingError(errorTypes.negativeNumber, startPos, endPos, currToken.text);
                        }
                        bitLimit = 5;
                        bitCount--;     //reduz bitcount pq so aceita os numeros positivos
                    }
                    else if (currToken.type === TerminalTypes.map.OFFSET) {
                        bitLimit = 16;
                    }
                    else if (currToken.type === TerminalTypes.map.ADDRESS) {
                        bitLimit = 26;
                    }

                    if (bitCount > bitLimit) {
                        throw new CompilingError(errorTypes.tooManyBits, startPos, endPos, bitLimit, bitCount);
                    }

                    //adiciona o valor do token na arvore
                    parseTree.root.findRightmostEmptyTerminal().value = currToken.text;

                    break;

                }
                else if (stackTop.type === currToken.type) {
                    // remove ultimo elemento da pilha e vai pro proximo token
                    this.permStack.pop();


                    //adiciona o valor do token na arvore
                    parseTree.root.findRightmostEmptyTerminal().value = currToken.text;

                    break;

                } else {
                    throw new CompilingError(errorTypes.invalidToken, startPos, endPos,
                        this.firstSet[stackTop.type].display(), TerminalTypes.revMap[currToken.type]);
                }
            }

            else if (stackTop instanceof Nonterminal) {
                const validProds = this.parsingTable[stackTop][currToken.type];

                //caso nao tenha nenhuma regra para essa combinação de terminal e nao terminal
                if (validProds.length === 0) {
                    const validTerminals=this.parsingTable[stackTop];
                    const validTokens = Object.keys(validTerminals).filter((key) => validTerminals[key].length > 0).map((val)=>TerminalTypes.revMap[val]);
                    
                    throw new CompilingError(errorTypes.invalidToken, startPos, endPos,
                        validTokens.display(), TerminalTypes.revMap[currToken.type]);

                    //return(`Erro sintático, caractere inesperado para resolver não-terminal ${stackTop.type}: ${TerminalTypes.revMap[currToken.type]}`);
                }
                else if (validProds.length === 1) {
                    //remove ultimo elemento da pilha e substitui com os simbolos da regra
                    this.permStack.pop();

                    const rightMostNode = parseTree.root.findRightmostEmptyNonterminal();

                    for (const s of [...validProds[0]].reverse()) {
                        if (s !== EPSILON) {
                            this.permStack.push(s);
                            if (rightMostNode != null) {
                                //console.log(rightMostNode.symbol, s, currToken);

                                // adiciona simbolo à arvore
                                if (s instanceof Nonterminal) {
                                    const node = new NonterminalNode(s);
                                    rightMostNode.addNonterminal(node);
                                }
                                else if (s instanceof Terminal) {
                                    const node = new TerminalNode(s);
                                    rightMostNode.addTerminal(node);
                                }
                            }
                            else {
                                return ('Algo de errado na árvore sintática');
                            }
                        }
                        //caso regra seja epsilon adiciona o no epsilon terminal
                        else {
                            if (rightMostNode != null) {
                                const node = new TerminalNode(s);
                                rightMostNode.addTerminal(node);
                            }
                        }
                    }
                }
            }
            else if (stackTop === EOF) {
                break;
            }
            else {
                throw new CompilingError(errorTypes.tableError, startPos, endPos, TerminalTypes.revMap[currToken.type]);
            }

            //avança pro proximo elemento da stack
            stackTop = this.permStack[this.permStack.length - 1];
        }
    }

    parseAll(sentence) {
        if (!this.checkIfLL1()) {
            console.log('Erro, gramática não é LL(1)!');
            return null;
        } else {

            const size = sentence.length;
            let i = 0;
            const stack = [EOF, this.startSymbol];
            let currToken = sentence[i];
            let stackTop = stack[stack.length - 1];

            const parseTree = new ParseTree(this.startSymbol);

            while (stackTop !== EOF) {
                //converte os tokens number para tipos numericos especificos
                if (currToken.type === TerminalTypes.map.NUMBER) {
                    if (stackTop.type == NonterminalTypes.OFFSET)
                        currToken.type = TerminalTypes.map.OFFSET;
                    else if (stackTop.type == NonterminalTypes.SHAMT)
                        currToken.type = TerminalTypes.map.SHAMT;
                    else if (stackTop.type == TerminalTypes.map.ADDRESS || stackTop.type == NonterminalTypes.T6)
                        currToken.type = TerminalTypes.map.ADDRESS;
                }

                if (stackTop instanceof Terminal) {
                    if (currToken.type === TerminalTypes.map.SHAMT || currToken.type === TerminalTypes.map.OFFSET || currToken.type === TerminalTypes.map.ADDRESS) {
                        const bitCount = countBits(currToken.text);

                        // remove ultimo elemento da pilha e vai pro proximo token
                        stack.pop();
                        i++;

                        let bitLimit;
                        if (currToken.type === TerminalTypes.map.SHAMT) {
                            if (currToken.text < 0) {
                                console.log(`Erro sintático, esperava por um número positivo e apareceu  um de negativo na posição ${i}`);
                                return null;
                            }
                            bitLimit = 6;   //6 ao inves de 5 pq so aceita os numeros positivos
                        }
                        if (currToken.type === TerminalTypes.map.OFFSET) {
                            bitLimit = 16;
                        }
                        if (currToken.type === TerminalTypes.map.ADDRESS) {
                            bitLimit = 26;
                        }
                        if (bitCount > bitLimit) {
                            console.log(`Erro sintático, esperava por um número de ${bitLimit} bits e apareceu  um de ${bitCount} bits na posição ${i}`);
                            return null;
                        }

                        //adiciona o valor do token na arvore
                        parseTree.root.findRightmostEmptyTerminal().value = currToken.text;

                        currToken = sentence[i];
                    }
                    else if (stackTop.type === currToken.type) {
                        // remove ultimo elemento da pilha e vai pro proximo token
                        stack.pop();
                        i++;

                        //adiciona o valor do token na arvore
                        parseTree.root.findRightmostEmptyTerminal().value = currToken.text;

                        currToken = sentence[i];
                    }
                    else {
                        console.log(`Erro sintático, esperava por ${TerminalTypes.revMap[stackTop.type]} e apareceu ${TerminalTypes.revMap[currToken.type]} na posição ${i}`);
                        return null;
                    }
                }

                else if (stackTop instanceof Nonterminal) {
                    //caso nao tenha nenhuma regra para essa combinação de terminal e nao terminal
                    if (this.parsingTable[stackTop][currToken.type].length === 0) {
                        console.log(`Erro sintático, caractere inesperado para resolver não-terminal ${stackTop.type}: ${TerminalTypes.revMap[currToken.type]} na posição ${i}`);
                        return null;
                    }
                    else if (this.parsingTable[stackTop][currToken.type].length === 1) {
                        //remove ultimo elemento da pilha e substitui com os simbolos da regra
                        stack.pop();

                        const rightMostNode = parseTree.root.findRightmostEmptyNonterminal();

                        for (const s of [...this.parsingTable[stackTop][currToken.type][0]].reverse()) {
                            if (s !== EPSILON) {
                                stack.push(s);
                                if (rightMostNode != null) {
                                    //console.log(rightMostNode.symbol, s, currToken);

                                    // adiciona simbolo à arvore
                                    if (s instanceof Nonterminal) {
                                        const node = new NonterminalNode(s);
                                        rightMostNode.addNonterminal(node);
                                    }
                                    else if (s instanceof Terminal) {
                                        const node = new TerminalNode(s);
                                        rightMostNode.addTerminal(node);
                                    }
                                }
                                else {
                                    console.log('Algo de errado na árvore sintática');
                                    return null;
                                }
                            }
                            //caso regra seja epsilon adiciona o no epsilon terminal
                            else {
                                if (rightMostNode != null) {
                                    const node = new TerminalNode(s);
                                    rightMostNode.addTerminal(node);
                                }
                            }
                        }
                    }
                }
                else {
                    console.log('Tem algo errado com a tabela de parsing.');
                    return null;
                }
                stackTop = stack[stack.length - 1];
            }

            if (currToken.type === TerminalTypes.map.EOF) {
                return parseTree;
            } else {
                //console.log(sentence)
                //console.log(currToken);
                console.log(`Erro sintático, esperava por EOF e apareceu: ${TerminalTypes.revMap[currToken.type]} na posição ${i}`);
                return null;
            }
        }
    }
}

function areObjectSetsEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (!keys1.every(key => keys2.includes(key))) {
        return false;
    }

    if (!keys2.every(key => keys1.includes(key))) {
        return false;
    }

    // checa se cada key é igual em cada
    for (const key of keys1) {
        const set1 = obj1[key];
        const set2 = obj2[key];

        if (!(set1 instanceof Set) || !(set2 instanceof Set)) {
            return false;
        }

        if (set1.size !== set2.size) {
            return false;
        }

        for (const value1 of set1) {
            let hasVal = false;
            for (const value2 of set2) {

                hasVal = areObjectsEqual(value1, value2);
                if (hasVal)
                    break;
            }

            if (!hasVal)
                return false;
        }
    }
    return true;
}

function areObjectsEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }

    return true;
}

//conta quantos bits seriam necessarios para represetnar um numero
function countBits(num) {
    const intNum = parseInt(num);
    if (intNum >= 0)
        return Math.ceil(Math.log(intNum + 1) / Math.log(2)) + 1;
    else
        return Math.ceil(Math.log(Math.abs(intNum)) / Math.log(2)) + 1;
}