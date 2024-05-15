const instErrorTypes = {
    invalidName: 1,
    invalidCode: 2,
    usedName: 3,
    usedCode: 4
}

class Instruction {
    constructor(name, code, format, suffix) {
        this.name = name.toUpperCase();
        this.interName = this.name + '_INST';
        this.code = code;
        this.format = format;
        this.suffix = suffix;
        this.productions = [];
        this.isInParser = false;
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

        instCodes[this.interName] = this.code;

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
                TerminalTypes.map[this.interName] = i;
                TerminalTypes.update();
                break;
            }
        }
        NonterminalTypes[this.interName] = this.interName;

        //cria os simbolos que serao usados no parser
        t_symbols[this.interName] = new Terminal(TerminalTypes.map[this.interName]);
        nt_symbols[this.interName] = new Nonterminal(NonterminalTypes[this.interName]);

        //cria as regras dessa instrução
        this.productions = [
            new Rule(nt_symbols[this.format], [nt_symbols[this.interName]]),
            new Rule(nt_symbols[this.interName], [t_symbols[this.interName], nt_symbols[this.suffix]])
        ]

        grammarProductions.push(...this.productions);

        this.isInParser = true;
        return this.isInParser;
    }

    update(name, code, format, suffix) {
        
        this.removeFromParser();

        this.name = name.toUpperCase();
        this.interName = this.name + '_INST';
        this.code = code;
        this.format = format;
        this.suffix = suffix;
        this.productions = [];

        this.addToParser();

        return this.isInParser;
    }

    removeFromParser() {
        if (!this.alreadyExists() || !this.isInParser) {
            return false;
        }

        delete instCodes[this.interName];
        delete TerminalTypes.map[this.interName];
        TerminalTypes.update();
        delete t_symbols[this.interName];
        delete NonterminalTypes[this.interName];
        delete nt_symbols[this.interName];

        //remove as regras da gramatica
        for (const rule of this.productions) {
            const index = grammarProductions.indexOf(rule);
            if (index !== -1) {
                grammarProductions.splice(index, 1);
            }
        }

        this.productions = [];
        this.isInParser = false;
    }

    isNameTaken(name) {
        name = name.toUpperCase();
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
        const nameExists = this.isNameTaken(this.interName);
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