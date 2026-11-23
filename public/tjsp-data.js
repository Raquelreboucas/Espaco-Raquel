/* Edital do TJSP Escrevente (Vunesp) e dados de apoio, copiados do Painel de Estudos TJSP. */
window.TJSP_DATA=(function(){
const EDITAL = [
  { bloco: "I", nome: "Língua Portuguesa", questoes: 16, materias: [
    { id: "pt", nome: "Língua Portuguesa", peso: 16, topicos: [
      ["Análise, compreensão e interpretação de textos verbais, não verbais, literários e não literários"],
      ["Informações literais e inferências possíveis"],
      ["Ponto de vista do autor"],
      ["Estruturação do texto: relações entre ideias; recursos de coesão"],
      ["Significação contextual de palavras e expressões"],
      ["Sinônimos e antônimos"],
      ["Sentido próprio e figurado das palavras"],
      ["Classes de palavras: emprego e sentido", "substantivo, adjetivo, artigo, numeral, pronome, verbo, advérbio, preposição e conjunção"],
      ["Concordância verbal e nominal"],
      ["Regência verbal e nominal"],
      ["Colocação pronominal"],
      ["Crase"],
      ["Pontuação"]
    ]}
  ]},
  { bloco: "II", nome: "Conhecimentos em Direito", questoes: 30, nota: "o edital não divide por matéria, então cada uma pesa 5", materias: [
    { id: "pen", nome: "Direito Penal", peso: 5, topicos: [
      ["Crimes contra a fé pública", "CP arts. 293 a 305; 307; 308; 311-A"],
      ["Crimes praticados por funcionário público contra a administração", "CP arts. 312 a 317; 319 a 327"],
      ["Crimes praticados por particular contra a administração", "CP arts. 328 a 333; 336 e 337"],
      ["Crimes contra a administração da justiça", "CP arts. 339 a 347; 357 e 359"]
    ]},
    { id: "ppen", nome: "Direito Processual Penal", peso: 5, topicos: [
      ["Juiz, Ministério Público, acusado e defensor", "CPP arts. 251 a 258; 261 a 267"],
      ["Serventuários e funcionários da justiça", "CPP art. 274"],
      ["Citações e intimações", "CPP arts. 351 a 372"],
      ["Procedimento comum e Tribunal do Júri", "CPP arts. 394 a 497"],
      ["Procedimento sumário", "CPP arts. 531 a 538"],
      ["Restauração de autos extraviados ou destruídos", "CPP arts. 541 a 548"],
      ["Recursos e habeas corpus", "CPP arts. 574 a 667"],
      ["Juizados Especiais Criminais", "Lei 9.099/95, arts. 60 a 83; 88 e 89"]
    ]},
    { id: "pciv", nome: "Direito Processual Civil", peso: 5, topicos: [
      ["Impedimento, suspeição e auxiliares da justiça", "CPC arts. 144 a 155"],
      ["Atos processuais: forma, tempo, lugar, prazos e comunicação", "CPC arts. 188 a 275"],
      ["Tutela provisória", "CPC arts. 294 a 311"],
      ["Procedimento comum e cumprimento de sentença", "CPC arts. 318 a 538"],
      ["Recursos", "CPC arts. 994 a 1.026"],
      ["Juizados Especiais Cíveis", "Lei 9.099/95, arts. 3º ao 19"],
      ["Juizados Especiais da Fazenda Pública", "Lei 12.153/2009"]
    ]},
    { id: "const", nome: "Direito Constitucional", peso: 5, topicos: [
      ["Direitos e deveres individuais e coletivos", "CF Título II, Capítulo I"],
      ["Direitos sociais", "CF Título II, Capítulo II"],
      ["Nacionalidade", "CF Título II, Capítulo III"],
      ["Administração Pública: disposições gerais e servidores", "CF Título III, Cap. VII, Seções I e II"],
      ["Órgãos do Poder Judiciário", "CF art. 92"]
    ]},
    { id: "adm", nome: "Direito Administrativo", peso: 5, topicos: [
      ["Estatuto dos Funcionários Públicos Civis de SP", "Lei 10.261/68, arts. 1º a 86"],
      ["Estatuto: arts. 171 a 175", "Lei 10.261/68"],
      ["Estatuto: deveres, proibições, responsabilidades, penalidades e processo", "Lei 10.261/68, arts. 239 a 323"],
      ["Lei de Improbidade Administrativa", "Lei 8.429/92"]
    ]},
    { id: "leg", nome: "Legislação Interna", peso: 5, topicos: [
      ["Teletrabalho no TJSP", "Resolução TJSP nº 850/2021"],
      ["Governança e uso do eproc", "Resolução TJSP nº 963/2025"],
      ["Plano de Cargos e Carreiras do TJSP", "Lei Complementar nº 1.111/2010"],
      ["Regimento Interno do Tribunal de Justiça"],
      ["NSCGJ Tomo I, Cap. II", "Seção I, subseções I e II"],
      ["NSCGJ Tomo I, Cap. III", "Seções I, II, V, VI e VII"],
      ["NSCGJ Tomo I, Cap. III, Seção VIII", "subseções I, II e III"],
      ["NSCGJ Tomo I, Cap. III", "Seções IX a XIX"],
      ["NSCGJ Tomo I, Cap. XI", "Seções I a VII"]
    ]}
  ]},
  { bloco: "III", nome: "Conhecimentos Gerais", questoes: 24, materias: [
    { id: "atu", nome: "Atualidades", peso: 4, topicos: [
      ["Fatos políticos, econômicos, sociais e culturais", "nacionais e internacionais, a partir do 1º semestre de 2026"],
      ["Estatuto da Pessoa com Deficiência", "Lei 13.146/2015, arts. 1º ao 13; 34 ao 38"]
    ]},
    { id: "mat", nome: "Matemática", peso: 4, topicos: [
      ["Operações com números reais"],
      ["Mínimo múltiplo comum e máximo divisor comum"],
      ["Razão e proporção"],
      ["Porcentagem"],
      ["Regra de três simples e composta"],
      ["Média aritmética simples e ponderada"],
      ["Juros simples"],
      ["Equação do 1º e 2º graus"],
      ["Sistema de equações do 1º grau"],
      ["Relação entre grandezas: tabelas e gráficos"],
      ["Sistemas de medidas usuais"],
      ["Noções de geometria", "forma, perímetro, área, volume, ângulo, teorema de Pitágoras"],
      ["Resolução de situações-problema"]
    ]},
    { id: "inf", nome: "Informática", peso: 9, topicos: [
      ["MS-Windows 10 ou superior", "pastas, diretórios, arquivos, atalhos, área de trabalho, área de transferência, menus e aplicativos"],
      ["MS-Word", "estrutura, edição e formatação, cabeçalhos, parágrafos, colunas, marcadores, tabelas, quebras, numeração, legendas, índices, objetos, campos, caixas de texto"],
      ["MS-Excel", "células, linhas, colunas, pastas, tabelas e gráficos, fórmulas, funções e macros, impressão, dados externos, classificação"],
      ["Correio eletrônico", "preparo e envio de mensagens, anexos"],
      ["Internet", "navegação, URL, links, sites, busca e impressão de páginas"],
      ["MS Teams", "chats, chamadas, grupos, trabalho em equipe com Word, Excel, PowerPoint, SharePoint e OneNote, reuniões e gravação"],
      ["OneDrive", "armazenamento e compartilhamento de arquivos"]
    ]},
    { id: "rlm", nome: "Raciocínio Lógico", peso: 7, topicos: [
      ["Relações arbitrárias entre pessoas, lugares, coisas e eventos", "dedução de informações e avaliação das condições"],
      ["Sequências numéricas e figurais"],
      ["Estruturas lógicas"],
      ["Lógica de argumentação"],
      ["Diagramas lógicos"]
    ]}
  ]}
];
const TOTAL_Q = 70;

/* Tópicos do TJSP que também caem em outros concursos (editais mais recentes publicados:
   Receita Federal 2022, FGV, Analista-Tributário e Auditor-Fiscal; INSS 2022, Cebraspe, Técnico do Seguro Social).
   R = Receita, I = INSS. NOTA_OUTROS explica quando o assunto é parecido, mas a lei cobrada é outra. */
const OUTROS = {
  "pt-0": "RI", "pt-1": "RI", "pt-2": "RI", "pt-3": "RI", "pt-4": "RI", "pt-5": "RI", "pt-6": "RI",
  "pt-7": "RI", "pt-8": "RI", "pt-9": "RI", "pt-10": "RI", "pt-11": "RI", "pt-12": "RI",
  "const-0": "RI", "const-1": "RI", "const-2": "RI", "const-3": "RI", "const-4": "R",
  "adm-0": "RI", "adm-2": "RI", "adm-3": "RI",
  "mat-0": "R", "mat-1": "R", "mat-2": "R", "mat-3": "RI", "mat-4": "R", "mat-5": "R", "mat-6": "R",
  "mat-9": "R", "mat-10": "R", "mat-11": "R", "mat-12": "R",
  "inf-0": "I", "inf-1": "I", "inf-2": "I", "inf-3": "I", "inf-4": "I",
  "rlm-0": "R", "rlm-1": "R", "rlm-2": "RI", "rlm-3": "RI", "rlm-4": "RI"
};
const NOTA_OUTROS = {
  "adm-0": "Parecido: lá cobram o estatuto federal (Lei 8.112/90: provimento, vacância, direitos), não a Lei 10.261/68",
  "adm-2": "Parecido: lá cobram o regime disciplinar e o PAD da Lei 8.112/90",
  "adm-3": "Igual: Lei 8.429/92 (com a Lei 14.230/21)",
  "const-4": "Na Receita o Poder Judiciário cai inteiro, não só o art. 92",
  "mat-5": "Na Receita entra em Estatística (média, moda, mediana)",
  "inf-1": "No INSS: editores de texto (Word e LibreOffice Writer)",
  "inf-2": "No INSS: planilhas (Excel e LibreOffice Calc)"
};
/* Tópicos que mais caem: q = questões nas provas Vunesp de Escrevente 2014, 2017, 2018 (Interior) e 2021;
   n = em quantas dessas 4 provas o tópico apareceu; foco = o que a banca mais pergunta dentro dele.
   Fora de Direito a contagem por tópico é aproximada, então só vai o foco. Fontes no painel #caiResumo. */
const CAI_MUITO = {
  "pt-0": { foco: "a maior fatia do bloco em toda prova: texto, charge e tirinha, com inferência e sentido global" },
  "pt-8": { foco: "reescrita de trechos que precisa manter a concordância" },
  "pt-9": { foco: "regência de verbos e nomes, muitas vezes junto com crase" },
  "pt-10": { foco: "posição do pronome na norma-padrão (próclise, ênclise)" },
  "pt-11": { foco: "lacunas com a/à/há; vem junto com regência" },
  "pt-12": { foco: "uso da vírgula e reescrita com pontuação correta" },
  "pen-0": { q: 9, n: 4, foco: "petrechos (art. 294), falsidade ideológica (299), atestado falso, falsa identidade (307) e fraude em certame (311-A); em 2021 foram 5 das 6 questões de Penal" },
  "pen-1": { q: 6, n: 3, foco: "peculato (inclusive culposo), conceito de funcionário público (327) e abandono de função" },
  "pen-3": { q: 7, n: 4, foco: "denunciação caluniosa (339), falso testemunho e falsa perícia (342), exploração de prestígio (357)" },
  "ppen-0": { q: 7, n: 4, foco: "impedimento e suspeição do juiz (arts. 252 a 254) e defensor obrigatório (261)" },
  "ppen-2": { q: 5, n: 4, foco: "citação por mandado e precatória (351 a 353) e citação por edital com suspensão (366)" },
  "ppen-3": { q: 7, n: 4, foco: "rejeição da denúncia (395) × absolvição sumária (397), ritos ordinário e sumário, Júri" },
  "ppen-7": { q: 4, n: 4, foco: "caiu em todas as provas: composição civil dos danos, transação penal, suspensão condicional do processo (89)" },
  "pciv-1": { q: 5, n: 4, foco: "contagem de prazos em dias úteis, forma dos atos, citação (quando não se cita)" },
  "pciv-3": { q: 5, n: 4, foco: "improcedência liminar, revelia, depoimento pessoal, audiência de instrução, alteração do pedido" },
  "const-0": { q: 9, n: 4, foco: "mandado de injunção, ação popular e ações gratuitas, fiança e penas vedadas, sigilo, tratados" },
  "const-3": { q: 8, n: 4, foco: "acumulação de cargos, estabilidade e disponibilidade, greve, cargo em comissão, readaptação; em 2024 foram 3 das 7 de Constitucional" },
  "adm-2": { q: 15, n: 4, foco: "penalidades e demissão, processo disciplinar (testemunhas, afastamento preventivo), recursos e revisão, prescrição, deveres e proibições" },
  "adm-3": { q: 15, n: 4, foco: "atos dos arts. 9º a 11, sanções (art. 12), procedimento, papel do MP e declaração de bens" },
  "leg-5": { q: 6, n: 3, foco: "sistema informatizado oficial, livros e classificadores, escrituração e modelos de expediente" },
  "atu-1": { foco: "2 questões fixas em 2017 e 2021 (com a Res. CNJ 230/16); hoje está dentro de Atualidades" },
  "mat-3": { foco: "aumento e desconto em situação-problema" },
  "mat-9": { foco: "leitura de tabelas e gráficos; 2 questões em 2021" },
  "mat-11": { foco: "área, perímetro e volume: 3 questões em 2014 e em 2017" },
  "inf-0": { foco: "Explorador de Arquivos, Área de Transferência, atalhos e pastas; 4 questões em 2017 e em 2021" },
  "inf-1": { foco: "guias e grupos, formatação, cabeçalho, impressão" },
  "inf-2": { foco: "fórmulas e funções, inserir colunas, área de impressão" },
  "rlm-1": { foco: "sequências de números, letras e figuras" },
  "rlm-2": { foco: "negação e equivalência de condicionais, De Morgan, verdade e falsidade" }
};
const CONCURSOS = { R: "Receita Federal", I: "INSS" };
const CURTO = { pt: "Português", pen: "Penal", ppen: "Proc. Penal", pciv: "Proc. Civil", const: "Constitucional", adm: "Administrativo", leg: "Leg. Interna", rlm: "Raciocínio" };

return{EDITAL,TOTAL_Q,OUTROS,NOTA_OUTROS,CAI_MUITO,CONCURSOS,CURTO};
})();
