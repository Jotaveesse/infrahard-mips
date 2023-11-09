const instErrorTypes = {
    invalidName: 1,
    invalidCode: 2,
    usedName: 3,
    usedCode: 4
}

class Instruction {
    constructor(name, code, format, suffix) {
        this.name = name.toUpperCase();
        this.code = code;
        this.format = format;
        this.suffix = suffix;
        this.productions = [];
    }

    addToParser() {
        const existsResult = this.alreadyExists();
        if (existsResult) {
            throw existsResult;
        }

        const invalidResult = this.isInvalid();

        if (invalidResult) {
            throw invalidResult;
        }

        instCodes[this.name] = this.code;

        let start;
        if (this.format == NonterminalTypes.R_FORMAT)
            start = 100;
        else if (this.format == NonterminalTypes.I_FORMAT)
            start = 200;
        else if (this.format == NonterminalTypes.J_FORMAT)
            start = 300;

        //escolhe o menor numero disponivel pro formato escolhido
        for (let i = start; i < (start + 100); i++) {
            if (TerminalTypes.revMap[i] === undefined) {
                TerminalTypes.map[this.name] = i;
                TerminalTypes.update();
                break;
            }
        }
        NonterminalTypes[this.name] = this.name;

        //cria os simbolos que serao usados no parser
        t_symbols[this.name] = new Terminal(TerminalTypes.map[this.name]);
        nt_symbols[this.name] = new Nonterminal(NonterminalTypes[this.name]);

        //cria as regras dessa instrução
        this.productions = [
            new Rule(nt_symbols[this.format], [nt_symbols[this.name]]),
            new Rule(nt_symbols[this.name], [t_symbols[this.name], nt_symbols[this.suffix]])
        ]

        grammarProductions.push(...this.productions);

        return true;
    }

    update(name, code, format, suffix) {
        const nameExists = this.isNameTaken(name);
        if (nameExists)
            throw nameExists;

        this.removeFromParser();

        this.name = name.toUpperCase();
        this.code = code;
        this.format = format;
        this.suffix = suffix;
        this.productions = [];

        return this.addToParser();
    }

    removeFromParser() {
        if (!this.alreadyExists()) {
            return false;
        }

        delete instCodes[this.name];
        delete TerminalTypes.map[this.name];
        TerminalTypes.update();
        delete t_symbols[this.name];
        delete NonterminalTypes[this.name];
        delete nt_symbols[this.name];

        //remove as regras da gramatica
        for (const rule of this.productions) {
            const index = grammarProductions.indexOf(rule);
            if (index !== -1) {
                grammarProductions.splice(index, 1);
            }
        }

        this.productions = [];
    }

    isNameTaken(name) {
        name= name.toUpperCase();
        let nameExists = false;

        nameExists ||= instCodes[name] !== undefined;
        nameExists ||= t_symbols[name] !== undefined;
        nameExists ||= nt_symbols[name] !== undefined;
        nameExists ||= NonterminalTypes[name] !== undefined;
        nameExists ||= TerminalTypes.map[name] !== undefined;

        if (nameExists)
            return new CompilingError(errorTypes.nameExists, null, null, name);
    }

    alreadyExists() {
        const nameExists = this.isNameTaken(this.name);
        if (nameExists)
            return nameExists;

        //checa se tem algum codigo repetido, no caso do formato R checa apenas outras instruções R
        for (let inst in instCodes) {
            if (instCodes[inst] === this.code) {
                const termType = TerminalTypes.map[inst];

                //entre 100 e 200 é formato R
                if (this.format == NonterminalTypes.R_FORMAT) {
                    if (termType >= 100 && termType < 200) {
                        return new CompilingError(errorTypes.codeExists, null, null, this.code, inst);
                    }
                }
                else {
                    if (termType >= 200 && termType < 400) {
                        return new CompilingError(errorTypes.codeExists, null, null, this.code, inst);
                    }
                }
            }
        }

        return false;
    }

    isInvalid() {
        const nameRegex = /^[A-Za-z]+$/;
        const codeRegex = /^[0-9A-Fa-f]+$/;
        const suffixRegex = /^T\d+$/;

        if (!nameRegex.test(this.name))
            return new CompilingError(errorTypes.nameInvalid, null, null, this.name);

        if (!codeRegex.test(this.code))
            return new CompilingError(errorTypes.codeInvalid, null, null, this.name, this.code);

        if (parseInt(this.code, 16) >= 64)
            return new CompilingError(errorTypes.codeTooBig, null, null, this.name, this.code);

        if (this.suffix === undefined || !suffixRegex.test(this.suffix))
            return new CompilingError(errorTypes.suffixInvalid, null, null, this.name, this.suffix);

        if (this.format !== NonterminalTypes.R_FORMAT &&
            this.format !== NonterminalTypes.I_FORMAT &&
            this.format !== NonterminalTypes.J_FORMAT
        )
            return new CompilingError(errorTypes.formatInvalid, null, null, this.name, this.format);

        return false;
    }
}