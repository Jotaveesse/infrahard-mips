class Lexer {
    constructor(input) {
        this.source = input;
        this.curChar = '';
        this.curPos = -1;
        this.nextChar();
    }

    nextChar() {
        this.curPos++;
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
        const emptyChars = [' ', '\t', '\r', '\f'];
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
            token = new Token(this.curChar, TokenType.map.EOF);
        } else if (this.curChar === '\n') {
            token = new Token(this.curChar, TokenType.map.NEWLINE);
        }
        else if (this.curChar === ',') {
            token = new Token(this.curChar, TokenType.map.COMMA);
        } else if (this.curChar === ':') {
            token = new Token(this.curChar, TokenType.map.COLON);
        } else if (this.curChar === '(') {
            token = new Token(this.curChar, TokenType.map.L_PAREN);
        } else if (this.curChar === ')') {
            token = new Token(this.curChar, TokenType.map.R_PAREN);
        } else if (this.curChar === '-' || isNum(this.curChar)) {
            const startPos = this.curPos;

            //caso seja um numero negativo
            if (this.curChar === '-' && isNaN(this.peek())) {
                this.abort("Caractere não reconhecido: " + this.curChar);
            }
            //nao aceita numero de multiplos digitos começados por 0
            else if (this.curChar === '0' && isNum(this.peek())) {
                this.abort("Caractere não reconhecido: " + this.curChar);
            } else {
                while (isNum(this.peek())) {
                    this.nextChar();
                }

                const text = this.source.substring(startPos, this.curPos + 1);
                token = new Token(text, TokenType.map.NUMBER);
            }
        } else if (this.curChar === '$') {
            const startPos = this.curPos;
            this.nextChar();

            //nao aceita numero de multiplos digitos começados por 0
            if (this.curChar === '0' && isNum(this.peek())) {
                console.log(isNum(this.peek()))
                this.abort("Caractere não reconhecido: " + this.curChar);
            } else {
                while (isNum(this.peek())) {
                    this.nextChar();
                }

                const text = this.source.substring(startPos, this.curPos + 1);
                token = new Token(text, TokenType.map.REG);
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
                token = new Token(text, TokenType.map.IDENT);
            } else {
                token = new Token(text, kind);
            }

        } else {
            this.abort("Caractere não reconhecido: " + this.curChar);
        }

        this.nextChar();
        return token;
    }
}

class Token {
    constructor(tokenText, tokenKind) {
        this.text = tokenText;
        this.kind = tokenKind;
    }

    static checkIfKeyword(word) {
        for (const kind of Object.keys(TokenType.map)) {
            //console.log(kind,word,TokenType[word] )

            if (kind === word.toUpperCase() && TokenType.map[kind] >= 100 && TokenType.map[kind] < 400) {
                return TokenType.map[kind];
            }
        }
        return null;
    }
   
}

Token.prototype.toString = function() {
       
    for (const key in TokenType.map) {
        if (TokenType.map.hasOwnProperty(key) && TokenType[key] === this.kind) {
            return key;
        }
    }
    return null;

}

function isNum(str) {
    return !isNaN(str) &&
        !isNaN(parseFloat(str));
}
