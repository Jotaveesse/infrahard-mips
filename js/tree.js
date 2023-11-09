class NonterminalNode {
    constructor(symbol) {
        this.symbol = symbol;
        this.nonterminals = [];
        this.terminals = [];
        this.position = null;
    }

    addNonterminalAtEnd(node) {
        if (node instanceof NonterminalNode) {
            this.nonterminals.push(node);
        } else {
            console.error(`Não é um nó não terminal: ${node}`);
        }
    }

    addTerminalAtEnd(node) {
        if (node instanceof TerminalNode) {
            this.terminals.push(node);
        } else {
            console.error(`Não é um nó terminal: ${node}`);
        }
    }

    addNonterminalAtStart(node) {
        if (node instanceof NonterminalNode) {
            this.nonterminals.unshift(node);
        } else {
            console.error(`Não é um nó não terminal: ${node}`);
        }
    }

    addTerminalAtStart(node) {
        if (node instanceof TerminalNode) {
            this.terminals.unshift(node);
        } else {
            console.error(`Não é um nó terminal: ${node}`);
        }
    }

    findRightmostEmptyNonterminal() {
        if (this.nonterminals.length === 0 && this.terminals.length === 0) {
            return this;
        }

        //navega pelos não terminais pelo nó mais a direita
        for (let i = this.nonterminals.length - 1; i >= 0; i--) {
            const nonterminal = this.nonterminals[i];
            const result = nonterminal.findRightmostEmptyNonterminal();
            if (result) {
                return result;
            }
        }

        return null;
    }

    findRightmostEmptyTerminal() {
        //navega pelos não terminais pelo nó mais a direita
        for (let i = this.nonterminals.length - 1; i >= 0; i--) {
            const nonterminal = this.nonterminals[i];
            const result = nonterminal.findRightmostEmptyTerminal();
            if (result) {
                return result;
            }
        }

        //checa se tem algum terminal com valor nulo e retorna ele
        for (let i = this.terminals.length - 1; i >= 0; i--) {
            const term = this.terminals[i];
            if (term.value == null) {
                return term;
            }
        }

        return null;
    }

    findLeftmostEmptyNonterminal() {
        if (this.nonterminals.length === 0 && this.terminals.length === 0) {
            return this;
        }

        //navega pelos não terminais pelo nó mais a direita
        for (let i = 0; i < this.nonterminals.length; i++) {
            const nonterminal = this.nonterminals[i];
            const result = nonterminal.findLeftmostEmptyNonterminal();
            if (result) {
                return result;
            }
        }

        return null;
    }

    findLeftmostEmptyTerminal() {
        //navega pelos não terminais pelo nó mais a direita
        for (let i = 0; i < this.nonterminals.length; i++) {
            const nonterminal = this.nonterminals[i];
            const result = nonterminal.findLeftmostEmptyTerminal();
            if (result) {
                return result;
            }
        }

        //checa se tem algum terminal com valor nulo e retorna ele
        for (let i = 0; i < this.terminals.length; i++) {
            const term = this.terminals[i];
            if (term.value == null) {
                return term;
            }
        }

        return null;
    }
}

class TerminalNode {
    constructor(symbol, value = null) {
        this.symbol = symbol;
        this.value = value;
    }
}

class ParseTree {
    constructor(rootValue) {
        this.root = new NonterminalNode(rootValue);
    }
}