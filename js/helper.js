class TwoWayMap {
    constructor(map) {
        this.map = map;
        this.revMap = {};
        this.update();
    }
    update() {
        for (const key in this.map) {
            const value = this.map[key];
            this.revMap[value] = key;
        }
    }
}

//cria as funções de display pra printar sets e arrays de forma bonita :)
Set.prototype.display = function () {
    const arr = Array.from(this);
    const modArr = arr.map((elem) => { return TerminalTypes.revMap[elem.type]; });
    if (modArr.length <= 1) {
        return modArr.join(', ');
    }
    const lastElement = modArr.pop();
    return modArr.join(', ') + ' ou ' + lastElement;
};

Array.prototype.display = function () {
    if (this.length <= 1) {
        return this.join(', ');
    }
    const lastElement = this.pop();
    return this.join(', ') + ' ou ' + lastElement;
};


function areObjectSetsEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (!keys1.every(key => keys2.includes(key))) {
        return false;
    }

    if (!keys2.every(key => keys1.includes(key))) {
        return false;
    }

    // checa se cada key é igual em cada
    for (const key of keys1) {
        const set1 = obj1[key];
        const set2 = obj2[key];

        if (!(set1 instanceof Set) || !(set2 instanceof Set)) {
            return false;
        }

        if (set1.size !== set2.size) {
            return false;
        }

        for (const value1 of set1) {
            let hasVal = false;
            for (const value2 of set2) {

                hasVal = areObjectsEqual(value1, value2);
                if (hasVal)
                    break;
            }

            if (!hasVal)
                return false;
        }
    }
    return true;
}

function areObjectsEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }

    return true;
}

//conta quantos bits seriam necessarios para represetnar um numero
function countBits(num) {
    const intNum = parseInt(num);
    if (intNum >= 0)
        return Math.ceil(Math.log(intNum + 1) / Math.log(2)) + 1;
    else
        return Math.ceil(Math.log(Math.abs(intNum)) / Math.log(2)) + 1;
}

function numberToBinary(num, size) {
    if (num < 0) {
        num = (1 << size) + num; // converte negativo usando complemento a 2
    }

    var binary = num.toString(2);

    while (binary.length < size) {
        binary = '0' + binary;
    }
    return binary;
}

function removeCharacter(inputString, charToRemove) {
    const index = inputString.indexOf(charToRemove);

    if (index === -1) {
        return inputString;
    }

    const beforeChar = inputString.slice(0, index);
    const afterChar = inputString.slice(index + 1);

    return beforeChar + afterChar;
}

//adiciona zeros pra que um numero fique com um tamanho minimo
function padNumber(number, minDigits) {
    const numberString = number.toString();
    const padding = '0'.repeat(Math.max(0, minDigits - numberString.length));
    return padding + numberString;
}

function areObjectSetsEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (!keys1.every(key => keys2.includes(key))) {
        return false;
    }

    if (!keys2.every(key => keys1.includes(key))) {
        return false;
    }

    // checa se cada key é igual em cada
    for (const key of keys1) {
        const set1 = obj1[key];
        const set2 = obj2[key];

        if (!(set1 instanceof Set) || !(set2 instanceof Set)) {
            return false;
        }

        if (set1.size !== set2.size) {
            return false;
        }

        for (const value1 of set1) {
            let hasVal = false;
            for (const value2 of set2) {

                hasVal = areObjectsEqual(value1, value2);
                if (hasVal)
                    break;
            }

            if (!hasVal)
                return false;
        }
    }
    return true;
}

function areObjectsEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }

    return true;
}

//conta quantos bits seriam necessarios para represetnar um numero
function countBits(num) {
    const intNum = parseInt(num);
    if (intNum >= 0)
        return Math.ceil(Math.log(intNum + 1) / Math.log(2)) + 1;
    else
        return Math.ceil(Math.log(Math.abs(intNum)) / Math.log(2)) + 1;
}