const errorTypes = {
    notAToken: 1,
    zeroStart: 2,
    invalidReg: 3,
    invalidKeyword: 4,
    invalidCharacter: 5,
    invalidToken: 6,
    negativeNumber: 7,
    tooManyBits: 8,
    tableError: 9,

    nameExists: 10,
    codeExists: 11,
    nameInvalid: 12,
    codeInvalid: 13,
    formatInvalid: 14,
    suffixInvalid: 15,
    codeTooBig: 16,

    invalidLabel: 17,

    nullToken: 18,
}

class CompilingError extends Error {
    constructor(errorType, startPos = null, endPos = null, var1 = null, var2 = null) {
        super();
        this.errorType = errorType;
        this.startPos = startPos;
        this.endPos = endPos;
        this.var1 = var1;
        this.var2 = var2;
        this.name = this.generateMessage();
    }

    generateMessage() {
        switch (this.errorType) {
            case errorTypes.notAToken:
                return `Token '${this.var1}' não reconhecido`;
            case errorTypes.zeroStart:
                return `Número iniciado por zero: '${this.var1}'`;
            case errorTypes.invalidReg:
                return `Registrador '${this.var1}' inválido`;
            case errorTypes.invalidKeyword:
                return `Identificador '${this.var1}' inválido`;
            case errorTypes.invalidCharacter:
                return `Caractere '${this.var1}' inválido`;
            case errorTypes.invalidToken:
                return `Esperava por ${this.var1} e apareceu um ${this.var2}`;
            case errorTypes.negativeNumber:
                return `Esperava por um número positivo e apareceu '${this.var1}'`;
            case errorTypes.tooManyBits:
                return `Esperava por um número de no máximo ${this.var1} bits e apareceu um de ${this.var2} bits`;
            case errorTypes.tableError:
                return `Tem algo errado com a tabela de parsing no não-terminal ${this.var1}`;
            case errorTypes.nameExists:
                return `Nome da instrução já está sendo utilizado`;
            case errorTypes.codeExists:
                return `Código já está sendo utilizado na instrução '${this.var2}'`;
            case errorTypes.nameInvalid:
                return `Nome da instrução é inválido, utilize apenas letras`;
            case errorTypes.codeInvalid:
                return `Código da instrução inválido, não é um número hexadecimal`;
            case errorTypes.formatInvalid:
                return `Formato '${this.var2}' da instrução '${this.var1}' inválido`;
            case errorTypes.suffixInvalid:
                return `Sufixo '${this.var2}' da instrução '${this.var1}' inválido`;
            case errorTypes.codeTooBig:
                return `Código da instrução inválido, o valor deve ser menor que 0x40 (64)`;
            case errorTypes.invalidLabel:
                return `Label '${this.var1}' não inicializada`;
                case errorTypes.nullToken:
                return `Token é nulo por algum motivo`;
                
            default:
                return `Erro de código ${this.errorType}`;
        }
    }
}