export interface iEvento {
  nome: string;
  operacao: string;
  valor: number;
}

export interface iCategoria {
  readonly _id: string;
  readonly categoria: string;
  descricao: string;
  eventos: Array<iEvento>;
}
