# Mips-to-Mif
Para atualizar as instruções padrão modifique a array instTemplates no arquivo contants.js 

Cada elemento dessa array consiste de uma instância da classe Instruction nesse formato:
new Instruction(NOME, OPCODE/FUNCT, FORMATO, TIPO_SUFIXO)

NOME: String que será o nome utilizado no código, pode ser qualquer combinação de letras não utilizada, com algumas exceções
OPCODE/FUNCT: String com o valor hexadecimal do opcode ou funct, dependendo do formato escolhido
FORMATO: Formato da instrução, deve-se escolher um desses três valores de NonterminalTypes: R_FORMAT, I_FORMAT ou J_FORMAT
TIPO_SUFIXO: Padrão dos valores e registradores que vão ser usados por essa instrução, deve-se escolher um desses onze valores de NonterminalTypes: T1, T2, T3, T4, T5, T6, T7, T8, T9, T10 ou T11. Os quais representam esses padrões:
T1 ->
T2 -> rs
T3 -> rd
T4 -> rs, rt
T5 -> rd, rs, rt
T6 -> address
T7 -> rt, imediato
T8 -> rd, rt, shamt
T9 -> rs, rt, offset
T10 -> rt, rs, offset
T11 -> rt, offset(rs)
