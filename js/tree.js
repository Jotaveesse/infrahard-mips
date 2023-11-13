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