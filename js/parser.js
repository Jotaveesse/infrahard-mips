class Symbol {
    constructor(value) {
        this.type = value;
    }

    toString() {
        return this.type;
    }
}

class Nonterminal extends Symbol {
    constructor(name) {
        super(name);
    }
}

class Terminal extends Symbol {
    constructor(name) {
        super(name);
    }
}

class SpecialSymbol extends Symbol {
    constructor(name, type) {
        super(name, type);
    }
}

class Rule {
    constructor(nt, production) {
        this.nonterminal = nt;
        this.production = production;
    }

    toString() {
        return `${this.nonterminal} -> ${this.production.join(' ')}`;
    }
}

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

        this.restartStacks();
        this.buildFirstSets();
        this.buildFollowSets();
        this.generateParsingTable();
    }

    restartStacks() {
        this.symbolStack = [EOF, this.startSymbol];
        this.treeStack = [];
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
            return new Set();
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

            this.buildTableEntry(prod, 0);
        }
    }

    buildTableEntry(prod, i) {
        for (const firstTerminal of this.firstSet[prod.production[i]]) {
            if (prod.production[i] === EPSILON) {
                for (const followTerminal of this.followSet[prod.nonterminal]) {
                    this.parsingTable[prod.nonterminal.type][followTerminal.type].push(prod.production);
                }
            } else if (firstTerminal === EPSILON) {
                if (prod.production.length > i + 1) {
                    this.buildTableEntry(prod, i + 1)

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

    getLastNonterminalNode() {
        for (let i = this.treeStack.length - 1; i >= 0; i--) {
            if (this.treeStack[i] instanceof NonterminalNode)
                return this.treeStack[i];
        }
        return null;
    }

    getLastTerminalNode() {
        for (let i = this.treeStack.length - 1; i >= 0; i--) {
            if (this.treeStack[i] instanceof TerminalNode)
                return this.treeStack[i];
        }
        return null;
    }

    parseToken(currToken, parseTree) {
        let stackTop = this.symbolStack[this.symbolStack.length - 1];
        const startPos = { line: currToken.line, ch: currToken.column };
        const endPos = { line: currToken.line, ch: currToken.column + currToken.text.length };

        if (this.treeStack.length === 0)
            this.treeStack.push(parseTree.root);

        while (true) {
            //converte os tokens number para tipos numericos especificos
            if (currToken.type === TerminalTypes.map.NUMBER) {
                if (stackTop.type == NonterminalTypes.OFFSET || stackTop.type == NonterminalTypes.T9_1)
                    currToken.type = TerminalTypes.map.OFFSET;
                else if (stackTop.type == NonterminalTypes.SHAMT)
                    currToken.type = TerminalTypes.map.SHAMT;
                else if (stackTop.type == TerminalTypes.map.ADDRESS || stackTop.type == NonterminalTypes.T6)
                    currToken.type = TerminalTypes.map.ADDRESS;
                else {
                    if (stackTop instanceof Terminal) {
                        const validTokens = [TerminalTypes.revMap[stackTop.type]];

                        throw new CompilingError(errorTypes.invalidToken, startPos, endPos,
                            validTokens.display(), TerminalTypes.revMap[currToken.type]);
                    }
                    else {
                        const validTerminals = this.parsingTable[stackTop];
                        //pega os nomes de cada token que seria aceitavel
                        const validTokens = Object.keys(validTerminals).filter((key) => validTerminals[key].length > 0).map((val) => TerminalTypes.revMap[val]);

                        throw new CompilingError(errorTypes.invalidToken, startPos, endPos,
                            validTokens.display(), TerminalTypes.revMap[currToken.type]);
                    }
                }
            }

            if (stackTop instanceof Terminal) {
                if (currToken.type === TerminalTypes.map.SHAMT ||
                    currToken.type === TerminalTypes.map.OFFSET ||
                    currToken.type === TerminalTypes.map.ADDRESS) {

                    //adiciona o valor do token na arvore
                    const lastTerminal = this.getLastTerminalNode();
                    lastTerminal.value = currToken.text;
                    lastTerminal.start = startPos;
                    lastTerminal.end = endPos;

                    // remove ultimo elemento da pilha e vai pro proximo token
                    this.symbolStack.pop();
                    this.treeStack.pop();

                    let bitCount = countBits(currToken.text);
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

                    break;
                }
                else if (stackTop.type === currToken.type) {
                    //adiciona o valor do token na arvore
                    const lastTerminal = this.getLastTerminalNode();
                    lastTerminal.value = currToken.text;
                    lastTerminal.start = startPos;
                    lastTerminal.end = endPos;

                    // remove ultimo elemento da pilha e vai pro proximo token
                    this.symbolStack.pop();
                    this.treeStack.pop();

                    break;
                }
                //caso seja um token não esperado
                else {
                    //pega os nomes de cada token que seria aceitavel
                    const validTokens = [TerminalTypes.revMap[stackTop.type]];

                    throw new CompilingError(errorTypes.invalidToken, startPos, endPos,
                        validTokens.display(), TerminalTypes.revMap[currToken.type]);
                }
            }
            else if (stackTop instanceof Nonterminal) {
                const validProds = this.parsingTable[stackTop][currToken.type];

                //caso nao tenha nenhuma regra para essa combinação de terminal e nao terminal
                if (!validProds || validProds.length == 0) {
                    const validTerminals = this.parsingTable[stackTop];
                    const validTokens = Object.keys(validTerminals).filter((key) => validTerminals[key].length > 0).map((val) => TerminalTypes.revMap[val]);

                    throw new CompilingError(errorTypes.invalidToken, startPos, endPos,
                        validTokens.display(), TerminalTypes.revMap[currToken.type]);

                }
                else if (validProds.length === 1) {
                    //remove ultimo elemento da pilha e substitui com os simbolos da regra

                    const leftMostNode = this.getLastNonterminalNode();
                    //console.log(leftMostNode.symbol, this.getLastNonterminalNode().symbol)
                    this.symbolStack.pop();
                    this.treeStack.pop();

                    for (const s of [...validProds[0]].reverse()) {
                        if (s !== EPSILON) {
                            this.symbolStack.push(s);
                            if (leftMostNode != null) {
                                // adiciona simbolo à arvore
                                if (s instanceof Nonterminal) {
                                    const node = new NonterminalNode(s);
                                    leftMostNode.addNonterminalAtStart(node);
                                    this.treeStack.push(node);
                                }
                                else if (s instanceof Terminal) {
                                    const node = new TerminalNode(s);
                                    leftMostNode.addTerminalAtStart(node);
                                    this.treeStack.push(node);
                                }
                            }
                            else {
                                throw new CompilingError(errorTypes.tableError, startPos, endPos, TerminalTypes.revMap[currToken.type]);
                            }
                        }
                        //caso regra seja epsilon adiciona o no epsilon terminal
                        else {
                            if (leftMostNode != null) {
                                const node = new TerminalNode(s, '');
                                leftMostNode.addTerminalAtStart(node);
                                //this.treeStack.push(node);    //nao precisa adicionar nó com EPSILON à treeStack
                            }
                        }
                    }
                }
                else {
                    throw new CompilingError(errorTypes.tableError, startPos, endPos, TerminalTypes.revMap[currToken.type]);
                }
            }
            else if (stackTop === EOF) {
                break;
            }
            else {
                throw new CompilingError(errorTypes.tableError, startPos, endPos, TerminalTypes.revMap[currToken.type]);
            }

            //avança pro proximo elemento da stack
            stackTop = this.symbolStack[this.symbolStack.length - 1];
        }
    }
}