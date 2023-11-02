class NonterminalNode {
    constructor(symbol) {
        this.symbol = symbol;
        this.nonterminals = [];
        this.terminals = [];
    }

    addNonterminal(node) {
        if (node instanceof NonterminalNode) {
            this.nonterminals.push(node);
        } else {
            console.error(`Não é um nó não terminal: ${node}`);
        }
    }

    addTerminal(node) {
        if (node instanceof TerminalNode) {
            this.terminals.push(node);
        } else {
            console.error(`Não é um nó terminal: ${node}`);
        }
    }

    findLeftmostEmptyNonterminal() {
        if (this.nonterminals.length === 0 && this.terminals.length === 0) {
            return this;
        }

        //navega pelos não terminais pelo nó mais a esquerda
        for (const nonterminal of this.nonterminals) {
            const result = nonterminal.findLeftmostEmptyNonterminal();
            if (result) {
                return result;
            }
        }

        return null;
    }

    findLeftmostNonterminal() {
        if (this.nonterminals.length === 0) {
            return this;
        }

        //navega pelos não terminais pelo nó mais a esquerda
        for (const nonterminal of this.nonterminals) {
            const result = nonterminal.findLeftmostNonterminal();
            if (result) {
                return result;
            }
        }

        return null;
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
        if (this.terminals.length !== 0) {
            for (const term of this.terminals) {
                if (term.value == null) {
                    return term;
                }
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