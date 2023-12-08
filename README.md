# Mips-to-Mif
Para atualizar as instruções padrão modifique a array instTemplates no arquivo contants.js 

Cada elemento dessa array consiste de uma instância da classe Instruction nesse formato:
new Instruction(NOME, OPCODE/FUNCT, FORMATO, TIPO_SUFIXO)

NOME: String que será o nome utilizado no código, pode ser qualquer combinação de letras, com algumas exceções<br>
OPCODE/FUNCT: String com o valor hexadecimal do opcode ou funct, dependendo do formato escolhido<br>
FORMATO: Formato da instrução, deve-se escolher um desses três valores de NonterminalTypes: R_FORMAT, I_FORMAT ou J_FORMAT<br>
TIPO_SUFIXO: Padrão dos valores e registradores que vão ser usados por essa instrução, deve-se escolher um desses onze valores de NonterminalTypes: T1, T2, T3, T4, T5, T6, T7, T8, T9, T10 ou T11. Os quais representam esses padrões:<br>
T1 -> <br>
T2 -> rs<br>
T3 -> rd<br>
T4 -> rs, rt<br>
T5 -> rd, rs, rt<br>
T6 -> address<br>
T7 -> rt, imediato<br>
T8 -> rd, rt, shamt<br>
T9 -> rs, rt, offset<br>
T10 -> rt, rs, offset<br>
T11 -> rt, offset(rs)<br>
