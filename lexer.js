const emptyChars = [' ', '\t', '\r', '\f'];
class Lexer {
    constructor(input) {
        this.source = input;
        this.curChar = '';
        this.curPos = -1;
        this.curLine = 0;
        this.curColumn = 0;
        this.nextChar();
    }

    nextChar() {
        this.curPos++;
        this.curColumn++;
        if (this.curPos >= this.source.length) {
            this.curChar = '\u0000'; // EOF
        } else {
            this.curChar = this.source[this.curPos];
        }
    }

    peek() {
        if (this.curPos + 1 >= this.source.length) {
            return '\0';
        } else {
            return this.source[this.curPos + 1];
        }
    }

    abort(message) {
        console.error("Erro léxico! " + message);
    }

    skipWhitespace() {
        while (emptyChars.includes(this.curChar)) {
            this.nextChar();
        }
    }

    skipComment() {
        if (this.curChar === '#') {
            this.nextChar();

            while (this.curChar !== '\n' && this.curChar !== '\u0000') {
                this.nextChar();
            }

            this.skipWhitespace();
            this.skipComment();
        }
    }

    getToken() {
        this.skipWhitespace();
        this.skipComment();

        let token = null;

        if (this.curChar === "\u0000") {
            token = new Token(this.curChar, TerminalTypes.map.EOF, this.curLine, this.curColumn);
        } else if (this.curChar === '\n') {
            token = new Token(this.curChar, TerminalTypes.map.NEWLINE, this.curLine, this.curColumn);
            this.curLine++;
            this.curColumn = 0;
        }
        else if (this.curChar === ',') {
            token = new Token(this.curChar, TerminalTypes.map.COMMA, this.curLine, this.curColumn);
        } else if (this.curChar === ':') {
            token = new Token(this.curChar, TerminalTypes.map.COLON, this.curLine, this.curColumn);
        } else if (this.curChar === '(') {
            token = new Token(this.curChar, TerminalTypes.map.L_PAREN, this.curLine, this.curColumn);
        } else if (this.curChar === ')') {
            token = new Token(this.curChar, TerminalTypes.map.R_PAREN, this.curLine, this.curColumn);
        } else if (this.curChar === '-' || isNum(this.curChar)) {
            const startPos = this.curPos;

            //caso seja um numero negativo
            if (this.curChar === '-' && isNaN(this.peek())) {
                throw new CompilingError(errorTypes.notAToken, { line: this.curLine, ch: this.curColumn - 1 },
                    { line: this.curLine, ch: this.curColumn + 1 }, this.curChar + this.peek());
            }
            //nao aceita numero de multiplos digitos começados por 0
            else if (this.curChar === '0' && isNum(this.peek())) {
                throw new CompilingError(errorTypes.zeroStart, { line: this.curLine, ch: this.curColumn - 1 },
                    { line: this.curLine, ch: this.curColumn + 1 }, this.curChar + this.peek());
            } else {
                while (isNum(this.peek())) {
                    this.nextChar();
                }
                const text = this.source.substring(startPos, this.curPos + 1);

                //se vier alguma letra apos o numero
                if (this.peek().match(/[a-zA-Z_]/))
                    throw new CompilingError(errorTypes.invalidKeyword, { line: this.curLine, ch: this.curColumn - text.length },
                        { line: this.curLine, ch: this.curColumn+1 }, text+this.peek());

                token = new Token(text, TerminalTypes.map.NUMBER, this.curLine, this.curColumn);
            }
        } else if (this.curChar === '$') {
            const startPos = this.curPos;
            this.nextChar();

            //nao aceita numero de multiplos digitos começados por 0
            if (this.curChar === '0' && isNum(this.peek())) {
                throw new CompilingError(errorTypes.zeroStart, { line: this.curLine, ch: this.curColumn - 1 },
                    { line: this.curLine, ch: this.curColumn + 1 }, this.curChar + this.peek());
            }
            else {
                while (isNum(this.peek())) {
                    this.nextChar();
                }

                const text = this.source.substring(startPos, this.curPos + 1);

                //se o numero do registrador for maior que 32
                if (removeCharacter(text, '$') <= 32)
                    token = new Token(text, TerminalTypes.map.REG, this.curLine, this.curColumn);
                else {
                    throw new CompilingError(errorTypes.invalidReg, { line: this.curLine, ch: this.curColumn - text.length },
                        { line: this.curLine, ch: this.curColumn }, text);
                }
            }
        } else if (this.curChar.match(/[a-zA-Z_]/)) {
            const startPos = this.curPos;
            let peekChar = this.peek();

            while (peekChar.match(/[a-zA-Z0-9_]/)) {
                this.nextChar();
                peekChar = this.peek();
            }

            const text = this.source.substring(startPos, this.curPos + 1);

            const kind = Token.checkIfKeyword(text);
            if (kind === null) {
                throw new CompilingError(errorTypes.invalidKeyword, { line: this.curLine, ch: this.curColumn - text.length },
                    { line: this.curLine, ch: this.curColumn }, text);
            } else {
                token = new Token(text, kind, this.curLine, this.curColumn);
            }

        } else {
            throw new CompilingError(errorTypes.invalidCharacter, { line: this.curLine, ch: this.curColumn-1 },
                { line: this.curLine, ch: this.curColumn }, this.curChar);
            this.abort("Caractere não reconhecido: " + this.curChar);
        }

        this.nextChar();
        return token;
    }
}

class Token {
    constructor(tokenText, tokenKind, line = 0, column = 0) {
        this.text = tokenText;
        this.type = tokenKind;
        this.line = line;
        this.column = column - tokenText.length;
    }

    static checkIfKeyword(word) {
        for (const kind of Object.keys(TerminalTypes.map)) {
            //console.log(kind,word,TokenType[word] )

            //100 a 400 sao as instruções
            if (kind === word.toUpperCase() && TerminalTypes.map[kind] >= 100 && TerminalTypes.map[kind] < 400) {
                return TerminalTypes.map[kind];
            }
        }
        return null;
    }

}

Token.prototype.toString = function () {

    for (const key in TerminalTypes.map) {
        if (TerminalTypes.map.hasOwnProperty(key) && TerminalTypes[key] === this.type) {
            return key;
        }
    }
    return null;

}

function isNum(str) {
    return !isNaN(str) &&
        !isNaN(parseFloat(str));
}
