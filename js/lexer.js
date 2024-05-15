const EOF_CHAR = '\u0000';

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
            this.curChar = EOF_CHAR;
        } else {
            this.curChar = this.source[this.curPos];
        }

        if (this.curChar === '\n') {
            this.curLine++;
            this.curColumn = 0;
        }
    }

    peek() {
        if (this.curPos + 1 >= this.source.length) {
            return EOF_CHAR;
        } else {
            return this.source[this.curPos + 1];
        }
    }

    skipWhitespace() {
        while (/[^\S\n]/.test(this.curChar)) {
            this.nextChar();
        }
    }

    skipComment() {
        if (this.curChar === '#') {
            this.nextChar();

            while (this.curChar !== '\n' && this.curChar !== EOF_CHAR) {
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

        if (this.curChar === EOF_CHAR) {
            token = new Token(this.curChar, TerminalTypes.map.EOF, this.curLine, this.curColumn);
        } else if (this.curChar === '\n') {
            token = new Token(this.curChar, TerminalTypes.map.NEWLINE, this.curLine, this.curColumn);
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
                if (/[a-zA-Z_]/.test(this.peek()))
                    throw new CompilingError(errorTypes.invalidKeyword, { line: this.curLine, ch: this.curColumn - text.length },
                        { line: this.curLine, ch: this.curColumn + 1 }, text + this.peek());

                token = new Token(text, TerminalTypes.map.NUMBER, this.curLine, this.curColumn);
            }
        //registradores
        } else if (this.curChar === '$') {
            const startPos = this.curPos;

            if(this.peek() !== EOF_CHAR)
                this.nextChar();

            //nao aceita numero de multiplos digitos começados por 0
            if (this.curChar === '0' && isNum(this.peek())) {
                throw new CompilingError(errorTypes.zeroStart, { line: this.curLine, ch: this.curColumn - 1 },
                    { line: this.curLine, ch: this.curColumn + 1 }, this.curChar + this.peek());
                    
            }
            else if(/\s/.test(this.curChar)){
                throw new CompilingError(errorTypes.invalidReg, { line: this.curLine, ch: this.curColumn - 2},
                    { line: this.curLine, ch: this.curColumn }, this.source.substring(startPos, this.curPos + 1));
            }
            else {
                while (/[^\s,]/.test(this.peek()) && this.peek() !== EOF_CHAR) {
                    this.nextChar();
                }

                const text = this.source.substring(startPos, this.curPos + 1);

                const dollarlessText = text.slice(1);

                //checa se é uma referencia de registrador por numero ou por keyword
                if (isNum(dollarlessText)) {
                    //se o numero do registrador for maior que 32
                    if (dollarlessText <= 32)
                        token = new Token(text, TerminalTypes.map.REG, this.curLine, this.curColumn);
                    else {
                        throw new CompilingError(errorTypes.invalidReg, { line: this.curLine, ch: this.curColumn - text.length },
                            { line: this.curLine, ch: this.curColumn }, text);
                    }
                }
                else {
                    const reg = registers[dollarlessText];

                    if (reg !== undefined) {
                        token = new Token('$' + reg, TerminalTypes.map.REG, this.curLine, this.curColumn);
                    }
                    else {
                        throw new CompilingError(errorTypes.invalidReg, { line: this.curLine, ch: this.curColumn - text.length },
                            { line: this.curLine, ch: this.curColumn }, text);
                    }

                }
            }
        //labels e instrucoes
        } else if (/[a-zA-Z_]/.test(this.curChar)) {
            const startPos = this.curPos;
            let peekChar = this.peek();

            while (/[^\s\\]/.test(peekChar) && peekChar !== EOF_CHAR) {
                this.nextChar();
                peekChar = this.peek();
            }

            const text = this.source.substring(startPos, this.curPos + 1);

            if(/[^a-zA-Z_]:/.test(text) || !/^[a-zA-Z_]+:?$/g.test(text)){
                throw new CompilingError(errorTypes.invalidKeyword, { line: this.curLine, ch: this.curColumn - text.length },
                    { line: this.curLine, ch: this.curColumn }, text);
            }

            const kind = Token.checkIfKeyword(text);

            //checa se é uma palavra reservada, se não for é uma label
            if (kind === null) {
                if (text[text.length - 1] === ':'){
                    token = new Token(text.slice(0,-1), TerminalTypes.map.LABEL_DECL, this.curLine, this.curColumn - 1);
                    this.nextChar();
                }
                else
                    token = new Token(text, TerminalTypes.map.LABEL, this.curLine, this.curColumn);

                // throw new CompilingError(errorTypes.invalidKeyword, { line: this.curLine, ch: this.curColumn - text.length },
                //     { line: this.curLine, ch: this.curColumn }, text);
            } else {
                token = new Token(text, kind, this.curLine, this.curColumn);
            }

        } else {
            throw new CompilingError(errorTypes.invalidCharacter, { line: this.curLine, ch: this.curColumn - 1 },
                { line: this.curLine, ch: this.curColumn }, this.curChar);
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
        var keywordId = TerminalTypes.map[(word.toUpperCase() + '_INST')];

        //100 a 400 sao as instruções
        if(keywordId && keywordId >= 100 && keywordId < 400){
            return keywordId;
        }
        else{
            return null;
        }
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